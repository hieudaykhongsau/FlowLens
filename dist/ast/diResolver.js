import * as fs from 'node:fs';
import * as path from 'node:path';
export class DiResolver {
    /**
     * Quét codebase và phân giải luồng tĩnh từ Endpoint -> Filter/Guard -> Service -> Repo
     */
    static async resolvePipeline(endpoint, method = 'GET', workspacePath = process.cwd()) {
        const cleanEndpoint = endpoint.trim();
        const cleanMethod = method.toUpperCase();
        // 1. Thử quét thực tế trong workspace xem có file Controller nào khớp không
        const matchedController = this.findControllerForEndpoint(cleanEndpoint, cleanMethod, workspacePath);
        if (matchedController) {
            return this.buildPipelineFromDiscoveredCode(matchedController, cleanEndpoint, cleanMethod, workspacePath);
        }
        // 2. Nếu workspace chưa có hoặc không tìm thấy khớp tuyệt đối, dựng pipeline chuẩn hoá dựa trên đường dẫn
        return this.buildStandardPipeline(cleanEndpoint, cleanMethod);
    }
    /**
     * Dò tìm file controller khớp với endpoint
     */
    static findControllerForEndpoint(endpoint, method, workspacePath) {
        if (!fs.existsSync(workspacePath))
            return null;
        const filesToSearch = [];
        this.collectCodeFiles(workspacePath, filesToSearch, 300);
        const endpointSegments = endpoint.split('/').filter(Boolean);
        const lastSegment = endpointSegments[endpointSegments.length - 1] || 'item';
        for (const filePath of filesToSearch) {
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                // Java Spring Boot match
                if (filePath.endsWith('.java') && (content.includes('@RestController') || content.includes('@Controller'))) {
                    if (content.includes(lastSegment) || (endpointSegments[0] && content.includes(endpointSegments[0]))) {
                        const lines = content.split('\n');
                        let className = path.basename(filePath, '.java');
                        let methodName = lastSegment;
                        let lineNumber = 1;
                        let guard;
                        const injectedServices = [];
                        // Detect injected services in constructor or fields
                        for (let i = 0; i < lines.length; i++) {
                            const line = lines[i];
                            if (line.includes('class ') && line.includes('{')) {
                                const match = line.match(/class\s+([A-Za-z0-9_]+)/);
                                if (match)
                                    className = match[1];
                            }
                            if (line.includes('@PreAuthorize')) {
                                guard = line.trim();
                            }
                            if (line.includes('Service') && (line.includes('private ') || line.includes('final '))) {
                                const match = line.match(/([A-Z][A-Za-z0-9_]*Service)\s+([a-zA-Z0-9_]+);/);
                                if (match)
                                    injectedServices.push(match[1]);
                            }
                            if (line.includes(`Mapping`) && (line.includes(lastSegment) || line.includes(endpoint))) {
                                lineNumber = i + 1;
                                // Next line might be method
                                for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
                                    const mMatch = lines[j].match(/public\s+[^\s]+\s+([a-zA-Z0-9_]+)\s*\(/);
                                    if (mMatch) {
                                        methodName = mMatch[1];
                                        break;
                                    }
                                }
                                break;
                            }
                        }
                        return {
                            file: path.relative(workspacePath, filePath).replace(/\\/g, '/'),
                            line: lineNumber,
                            className,
                            methodName,
                            guard,
                            injectedServices: injectedServices.length > 0 ? injectedServices : [`${className.replace('Controller', '')}Service`]
                        };
                    }
                }
                // TypeScript / NestJS match
                if ((filePath.endsWith('.ts') || filePath.endsWith('.js')) && content.includes('@Controller')) {
                    if (content.includes(lastSegment)) {
                        return {
                            file: path.relative(workspacePath, filePath).replace(/\\/g, '/'),
                            line: 1,
                            className: path.basename(filePath, path.extname(filePath)),
                            methodName: lastSegment,
                            injectedServices: [`${lastSegment}Service`]
                        };
                    }
                }
            }
            catch {
                // Skip unreadable files
            }
        }
        return null;
    }
    static collectCodeFiles(dir, fileList, maxFiles) {
        if (fileList.length >= maxFiles)
            return;
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (fileList.length >= maxFiles)
                    break;
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    if (entry.name === 'node_modules' ||
                        entry.name === '.git' ||
                        entry.name === 'target' ||
                        entry.name === 'build' ||
                        entry.name === 'dist' ||
                        entry.name === '.idea') {
                        continue;
                    }
                    this.collectCodeFiles(fullPath, fileList, maxFiles);
                }
                else if (entry.isFile() &&
                    (entry.name.endsWith('.java') ||
                        entry.name.endsWith('.ts') ||
                        entry.name.endsWith('.js') ||
                        entry.name.endsWith('.py') ||
                        entry.name.endsWith('.go'))) {
                    fileList.push(fullPath);
                }
            }
        }
        catch {
            // Ignore directory read errors
        }
    }
    static buildPipelineFromDiscoveredCode(discovered, endpoint, method, _workspacePath) {
        const nodes = [];
        const edges = [];
        // 1. Entrypoint node
        const entryNode = {
            id: 'node-entrypoint',
            type: 'entrypoint',
            label: `${method} ${endpoint}`,
            sublabel: `${discovered.className}.${discovered.methodName}()`,
            file: discovered.file,
            line: discovered.line,
            state: 'NOT_VERIFIED',
            certainty: 'EXPLICIT',
            confidence: 0.9,
            method
        };
        nodes.push(entryNode);
        let prevNodeId = entryNode.id;
        // 2. Guard or Security Filter if detected
        if (discovered.guard) {
            const guardNode = {
                id: 'node-guard',
                type: 'guard',
                label: 'Security Guard Check',
                sublabel: discovered.guard,
                file: discovered.file,
                line: Math.max(1, discovered.line - 1),
                state: 'NOT_VERIFIED',
                certainty: 'EXPLICIT',
                confidence: 0.85
            };
            nodes.push(guardNode);
            edges.push({ id: `e-${prevNodeId}-${guardNode.id}`, source: prevNodeId, target: guardNode.id, label: 'Authorize' });
            prevNodeId = guardNode.id;
        }
        // 3. Service Nodes (Resolving Injected Services)
        const serviceNodes = [];
        for (let i = 0; i < discovered.injectedServices.length; i++) {
            const serviceName = discovered.injectedServices[i];
            const serviceNode = {
                id: `node-service-${i + 1}`,
                type: 'service',
                label: serviceName,
                sublabel: `${discovered.methodName}() logic`,
                state: 'NOT_VERIFIED',
                certainty: 'EXPLICIT',
                confidence: 0.80
            };
            nodes.push(serviceNode);
            serviceNodes.push(serviceNode);
            edges.push({ id: `e-${prevNodeId}-${serviceNode.id}`, source: prevNodeId, target: serviceNode.id, label: 'Delegate' });
            prevNodeId = serviceNode.id;
        }
        // 4. Repository Node
        const repoName = discovered.className.replace('Controller', 'Repository');
        const repoNode = {
            id: 'node-repository',
            type: 'repository',
            label: repoName,
            sublabel: 'Database Operation',
            state: 'NOT_VERIFIED',
            certainty: 'INFERRED',
            confidence: 0.65
        };
        nodes.push(repoNode);
        edges.push({ id: `e-${prevNodeId}-${repoNode.id}`, source: prevNodeId, target: repoNode.id, label: 'Query / Persist' });
        // 5. Database Node
        const dbNode = {
            id: 'node-database',
            type: 'database',
            label: 'Database Connection',
            sublabel: 'RDBMS / NoSQL Store',
            state: 'NOT_VERIFIED',
            certainty: 'INFERRED',
            confidence: 0.50
        };
        nodes.push(dbNode);
        edges.push({ id: `e-${repoNode.id}-${dbNode.id}`, source: repoNode.id, target: dbNode.id, label: 'Transaction' });
        return {
            entrypointNode: entryNode,
            filterNodes: discovered.guard ? [nodes[1]] : [],
            serviceNodes,
            repositoryNodes: [repoNode],
            databaseNode: dbNode,
            edges
        };
    }
    static buildStandardPipeline(endpoint, method) {
        const parts = endpoint.split('/').filter(Boolean);
        const domain = parts[parts.length - 1] || 'resource';
        const capitalizedDomain = domain.charAt(0).toUpperCase() + domain.slice(1);
        const entryNode = {
            id: 'node-entrypoint',
            type: 'entrypoint',
            label: `${method} ${endpoint}`,
            sublabel: `${capitalizedDomain}Controller.handleRequest()`,
            state: 'NOT_VERIFIED',
            certainty: 'EXPLICIT',
            confidence: 0.85,
            method
        };
        const filterNode = {
            id: 'node-filter',
            type: 'filter',
            label: 'Auth & Validation Filter',
            sublabel: 'Token Verification & Request DTO Validator',
            state: 'NOT_VERIFIED',
            certainty: 'INFERRED',
            confidence: 0.60
        };
        const serviceNode = {
            id: 'node-service',
            type: 'service',
            label: `${capitalizedDomain}Service`,
            sublabel: `execute${capitalizedDomain}Operation()`,
            state: 'NOT_VERIFIED',
            certainty: 'INFERRED',
            confidence: 0.60
        };
        const repoNode = {
            id: 'node-repository',
            type: 'repository',
            label: `${capitalizedDomain}Repository`,
            sublabel: `findOrSave${capitalizedDomain}()`,
            state: 'NOT_VERIFIED',
            certainty: 'INFERRED',
            confidence: 0.50
        };
        const dbNode = {
            id: 'node-database',
            type: 'database',
            label: 'Persistent Store',
            sublabel: 'SQL / NoSQL Engine',
            state: 'NOT_VERIFIED',
            certainty: 'INFERRED',
            confidence: 0.40
        };
        const edges = [
            { id: 'e1-2', source: entryNode.id, target: filterNode.id, label: 'HTTP Context', animated: true },
            { id: 'e2-3', source: filterNode.id, target: serviceNode.id, label: 'Validated DTO', animated: true },
            { id: 'e3-4', source: serviceNode.id, target: repoNode.id, label: 'Business Call', animated: true },
            { id: 'e4-5', source: repoNode.id, target: dbNode.id, label: 'SQL Statement', animated: true }
        ];
        return {
            entrypointNode: entryNode,
            filterNodes: [filterNode],
            serviceNodes: [serviceNode],
            repositoryNodes: [repoNode],
            databaseNode: dbNode,
            edges
        };
    }
}
