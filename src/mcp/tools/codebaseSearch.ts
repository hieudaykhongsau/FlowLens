import * as fs from 'node:fs';
import * as path from 'node:path';

export async function handleCodebaseSearch(args: {
  query: string;
  workspacePath?: string;
  fileExtensions?: string[];
  maxResults?: number;
}) {
  const query = args.query;
  const workspacePath = args.workspacePath || process.cwd();
  const extensions = args.fileExtensions || ['.java', '.ts', '.js', '.py', '.go', '.json', '.xml', '.yml', '.yaml'];
  const maxResults = args.maxResults || 20;

  const matches: Array<{ file: string; line: number; content: string }> = [];

  function searchDir(dir: string) {
    if (matches.length >= maxResults) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (matches.length >= maxResults) break;
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (['node_modules', '.git', 'target', 'dist', 'build', '.idea'].includes(entry.name)) continue;
          searchDir(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            try {
              const fileText = fs.readFileSync(fullPath, 'utf-8');
              if (fileText.includes(query)) {
                const lines = fileText.split('\n');
                for (let i = 0; i < lines.length; i++) {
                  if (lines[i].includes(query)) {
                    matches.push({
                      file: path.relative(workspacePath, fullPath).replace(/\\/g, '/'),
                      line: i + 1,
                      content: lines[i].trim()
                    });
                    if (matches.length >= maxResults) break;
                  }
                }
              }
            } catch {
              // Ignore unreadable files
            }
          }
        }
      }
    } catch {
      // Ignore directory errors
    }
  }

  searchDir(workspacePath);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            query,
            totalMatches: matches.length,
            results: matches
          },
          null,
          2
        )
      }
    ]
  };
}
