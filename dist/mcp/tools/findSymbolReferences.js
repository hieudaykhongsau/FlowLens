import * as fs from 'node:fs';
import * as path from 'node:path';
export async function handleFindSymbolReferences(args) {
    const symbol = args.symbolName;
    const workspacePath = args.workspacePath || process.cwd();
    const maxResults = args.maxResults || 25;
    const references = [];
    function scanDir(dir) {
        if (references.length >= maxResults)
            return;
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (references.length >= maxResults)
                    break;
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    if (['node_modules', '.git', 'target', 'dist', 'build', '.idea'].includes(entry.name))
                        continue;
                    scanDir(fullPath);
                }
                else if (entry.isFile()) {
                    const ext = path.extname(entry.name);
                    if (['.java', '.ts', '.js', '.py', '.go'].includes(ext)) {
                        try {
                            const content = fs.readFileSync(fullPath, 'utf-8');
                            if (content.includes(symbol)) {
                                const lines = content.split('\n');
                                for (let i = 0; i < lines.length; i++) {
                                    const line = lines[i];
                                    if (line.includes(symbol)) {
                                        let kind = 'usage';
                                        if (line.includes('import ') || line.includes('package ')) {
                                            kind = 'import';
                                        }
                                        else if (line.includes(`class ${symbol}`) ||
                                            line.includes(`interface ${symbol}`) ||
                                            line.includes(`function ${symbol}`) ||
                                            line.includes(` ${symbol}(`)) {
                                            kind = 'declaration';
                                        }
                                        references.push({
                                            file: path.relative(workspacePath, fullPath).replace(/\\/g, '/'),
                                            line: i + 1,
                                            snippet: line.trim(),
                                            kind
                                        });
                                        if (references.length >= maxResults)
                                            break;
                                    }
                                }
                            }
                        }
                        catch {
                            // Skip unreadable files
                        }
                    }
                }
            }
        }
        catch {
            // Ignore
        }
    }
    scanDir(workspacePath);
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    symbol,
                    totalReferences: references.length,
                    references
                }, null, 2)
            }
        ]
    };
}
