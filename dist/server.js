import * as http from 'node:http';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { WebSocketHub } from './websocket/wsHub.js';
import { handleTraceEndpointPipeline } from './mcp/tools/tracePipeline.js';
import { handleUpdateInvestigationSession } from './mcp/tools/updateSession.js';
import { handleExecuteSandboxedRunner } from './mcp/tools/executeRunner.js';
import { handleCodebaseSearch } from './mcp/tools/codebaseSearch.js';
import { handleFindSymbolReferences } from './mcp/tools/findSymbolReferences.js';
import { handleParseCurlRequest } from './mcp/tools/parseCurl.js';
import { availableResources, handleReadResource } from './mcp/resources/index.js';
import { availablePrompts, handleGetPrompt } from './mcp/prompts/index.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = parseInt(process.env.FLOWLENS_PORT || '9876', 10);
// ==========================================
// 1. HTTP Server & Canvas Static File Server
// ==========================================
function serveStatic(req, res) {
    const possibleCanvasDirs = [
        path.join(__dirname, 'canvas'),
        path.join(__dirname, '../dist/canvas'),
        path.join(__dirname, '../canvas/dist')
    ];
    let canvasDir = possibleCanvasDirs.find(d => fs.existsSync(d));
    let reqPath = (req.url || '/').split('?')[0];
    if (reqPath === '/' || reqPath === '')
        reqPath = '/index.html';
    if (canvasDir) {
        const filePath = path.join(canvasDir, reqPath);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath);
            const mimeTypes = {
                '.html': 'text/html',
                '.js': 'application/javascript',
                '.css': 'text/css',
                '.json': 'application/json',
                '.png': 'image/png',
                '.svg': 'image/svg+xml'
            };
            res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
            fs.createReadStream(filePath).pipe(res);
            return;
        }
        // SPA fallback: return index.html
        const indexPath = path.join(canvasDir, 'index.html');
        if (fs.existsSync(indexPath)) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            fs.createReadStream(indexPath).pipe(res);
            return;
        }
    }
    // Fallback dev view if canvas build not found
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html>
<html>
<head>
  <title>FlowLens MCP Server</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: #1e293b; padding: 2rem; border-radius: 12px; border: 1px solid #334155; max-width: 500px; text-align: center; }
    h1 { color: #38bdf8; margin-bottom: 0.5rem; }
    p { color: #94a3b8; line-height: 1.5; }
    .badge { display: inline-block; background: #0369a1; color: #e0f2fe; padding: 4px 10px; border-radius: 999px; font-size: 0.85rem; font-weight: 600; margin-top: 1rem; }
    code { background: #0f172a; padding: 2px 6px; border-radius: 4px; font-family: monospace; color: #38bdf8; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🔍 FlowLens MCP Server</h1>
    <p>WebSocket Hub đang lắng nghe tại cổng <code>ws://localhost:${PORT}</code></p>
    <div class="badge">Canvas UI Đang Đợi Build</div>
    <p style="margin-top: 1.5rem; font-size: 0.9rem;">Hãy chạy <code>npm run build:canvas</code> trong thư mục dự án để hoàn thiện giao diện 2D Canvas trực quan.</p>
  </div>
</body>
</html>`);
}
const httpServer = http.createServer((req, res) => {
    // Allow CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    serveStatic(req, res);
});
// Attach WebSocket Hub
const wsHub = WebSocketHub.getInstance();
wsHub.attachToServer(httpServer);
httpServer.listen(PORT, () => {
    // MCP protocol uses stdio, so write diagnostics to stderr, NOT stdout!
    console.error(`[FlowLens] HTTP Server & WebSocket Hub running on http://localhost:${PORT}`);
});
// ==========================================
// 2. Model Context Protocol (MCP) Server
// ==========================================
const mcpServer = new Server({
    name: 'flowlens',
    version: '1.0.0'
}, {
    capabilities: {
        tools: {},
        resources: {},
        prompts: {}
    }
});
// Register list of available tools
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'trace_endpoint_pipeline',
                description: 'Composite Macro Tool: Quét và dựng toàn bộ khung pipeline API (Route -> Filter -> Injected Service -> Repository -> Database) trong 1 round-trip duy nhất, tiết kiệm 70% token context.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        endpoint: {
                            type: 'string',
                            description: 'Đường dẫn endpoint API cần điều tra (ví dụ: /api/v1/regulations/approve)'
                        },
                        method: {
                            type: 'string',
                            description: 'HTTP Method (GET, POST, PUT, DELETE, PATCH). Mặc định là GET'
                        },
                        workspacePath: {
                            type: 'string',
                            description: 'Thư mục gốc của workspace mã nguồn cần quét. Mặc định là thư mục hiện tại.'
                        },
                        curlCommand: {
                            type: 'string',
                            description: 'Lệnh cURL nguyên bản của user (tùy chọn)'
                        },
                        errorCode: {
                            type: 'number',
                            description: 'Mã lỗi HTTP nhận được (ví dụ: 400, 401, 403, 500)'
                        }
                    },
                    required: ['endpoint']
                }
            },
            {
                name: 'update_investigation_session',
                description: 'Cập nhật trạng thái phiên điều tra, đánh dấu node STOPPED_HERE, PASSED hoặc SKIPPED, đính kèm thẻ Causal WHY và Code Evidence để đồng bộ tức thì lên 2D Canvas.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        sessionId: { type: 'string', description: 'ID phiên điều tra' },
                        endpoint: { type: 'string' },
                        method: { type: 'string' },
                        currentStep: { type: 'number', description: 'Bước hiện tại trong quy trình 6 bước (1 đến 6)' },
                        stepStatus: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'failed'] },
                        stepSummary: { type: 'string', description: 'Tóm tắt nội dung bước vừa thực hiện' },
                        nodes: { type: 'array', description: 'Danh sách các node trong đồ thị thực thi' },
                        edges: { type: 'array', description: 'Danh sách các edge liên kết các node' },
                        rootCauseNodeId: { type: 'string', description: 'ID của node được xác định là nguyên nhân gốc rễ (STOPPED_HERE)' },
                        summary: { type: 'string', description: 'Kết luận điều tra tổng quan' },
                        status: { type: 'string', enum: ['running', 'completed', 'failed'] }
                    }
                }
            },
            {
                name: 'execute_sandboxed_runner',
                description: 'Thực thi runner kiểm thử trong sandbox an toàn với whitelist (mvn, gradle, npm, pytest, go) hoặc đọc passive log để trích xuất Stack Trace xác thực runtime.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        command: {
                            type: 'string',
                            enum: ['mvn', 'gradle', 'npm', 'pnpm', 'pytest', 'python', 'go'],
                            description: 'Lệnh runner cần thực thi'
                        },
                        args: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Danh sách đối số truyền vào runner'
                        },
                        cwd: {
                            type: 'string',
                            description: 'Thư mục thực thi'
                        },
                        timeoutMs: {
                            type: 'number',
                            description: 'Thời gian timeout (mặc định 30000ms)'
                        },
                        mode: {
                            type: 'string',
                            enum: ['active', 'ephemeral_mock', 'passive_log'],
                            description: 'Chế độ xác minh runtime: active (chạy test suite), ephemeral_mock (chạy test tạm), passive_log (quét file log)'
                        }
                    },
                    required: ['command', 'args']
                }
            },
            {
                name: 'codebase_search',
                description: 'Tìm kiếm ký tự, symbol, annotations trong toàn bộ repo bằng phương pháp tất định (deterministic lexical search).',
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: { type: 'string', description: 'Từ khóa hoặc symbol cần tìm' },
                        workspacePath: { type: 'string' },
                        fileExtensions: { type: 'array', items: { type: 'string' } },
                        maxResults: { type: 'number' }
                    },
                    required: ['query']
                }
            },
            {
                name: 'find_symbol_references',
                description: 'Dò tìm vị trí khai báo và các nơi tham chiếu gọi tới symbol (class, method, interface) để giải quyết đa hình và call graph.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        symbolName: { type: 'string', description: 'Tên symbol cần dò tìm (ví dụ: RegulationTypeService)' },
                        workspacePath: { type: 'string' },
                        maxResults: { type: 'number' }
                    },
                    required: ['symbolName']
                }
            },
            {
                name: 'parse_curl_request',
                description: 'Phân tích cú pháp lệnh cURL thông minh: tự động bóc tách Method, Endpoint, Query Params, Headers, Body và giải mã claims/roles/expiration từ JWT Token không cần thư viện ngoài.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        curlCommand: {
                            type: 'string',
                            description: 'Lệnh cURL nguyên bản (hỗ trợ nhiều dòng gạch chéo ngược \\, headers, body JSON, bearer token)'
                        }
                    },
                    required: ['curlCommand']
                }
            }
        ]
    };
});
// Handle tool executions
mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case 'trace_endpoint_pipeline':
                return await handleTraceEndpointPipeline(args);
            case 'update_investigation_session':
                return await handleUpdateInvestigationSession(args);
            case 'execute_sandboxed_runner':
                return await handleExecuteSandboxedRunner(args);
            case 'codebase_search':
                return await handleCodebaseSearch(args);
            case 'find_symbol_references':
                return await handleFindSymbolReferences(args);
            case 'parse_curl_request':
                return await handleParseCurlRequest(args);
            default:
                throw new Error(`Unknown FlowLens MCP tool: ${name}`);
        }
    }
    catch (err) {
        return {
            isError: true,
            content: [
                {
                    type: 'text',
                    text: `Error executing tool ${name}: ${err.message}`
                }
            ]
        };
    }
});
// ==========================================
// 3. MCP Resources & Prompts Handlers
// ==========================================
// Register list of available resources
mcpServer.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
        resources: availableResources
    };
});
// Handle reading resource contents
mcpServer.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    return await handleReadResource(uri, PORT);
});
// Register list of available prompts
mcpServer.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
        prompts: availablePrompts
    };
});
// Handle getting prompt
mcpServer.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return await handleGetPrompt(name, args || {}, PORT);
});
// Start Stdio transport
async function run() {
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
    console.error('[FlowLens] MCP Server connected via stdio transport successfully.');
}
run().catch((error) => {
    console.error('[FlowLens] Fatal error starting MCP server:', error);
    process.exit(1);
});
