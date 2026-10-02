import { SessionStore } from '../../engine/sessionStore.js';
export const availableResources = [
    {
        uri: 'flowlens://session/current',
        name: 'Current Investigation Session',
        description: 'JSON snapshot của phiên điều tra FlowLens đang hoạt động gồm danh sách node, edge, causal WHY, certainty score và tiến trình 6 bước.',
        mimeType: 'application/json'
    },
    {
        uri: 'flowlens://canvas-url',
        name: 'FlowLens Canvas Web URL',
        description: 'Đường dẫn cục bộ mở giao diện đồ thị 2D trực quan trên trình duyệt (mặc định: http://localhost:9876).',
        mimeType: 'text/plain'
    },
    {
        uri: 'flowlens://evidence/root-cause',
        name: 'Root Cause Causal WHY and Code Evidence',
        description: 'Bằng chứng mã nguồn (Code Evidence), thẻ Causal WHY 4 thành phần và log runtime của node bị lỗi (STOPPED_HERE).',
        mimeType: 'application/json'
    },
    {
        uri: 'flowlens://pipeline/summary',
        name: 'Pipeline Execution Summary',
        description: 'Báo cáo tổng kết toàn bộ luồng thực thi API dưới dạng Markdown (các node PASSED, STOPPED_HERE, SKIPPED, độ tin cậy tất định).',
        mimeType: 'text/markdown'
    }
];
export async function handleReadResource(uri, port = 9876) {
    const store = SessionStore.getInstance();
    const session = store.getSession();
    switch (uri) {
        case 'flowlens://session/current': {
            return {
                contents: [
                    {
                        uri,
                        mimeType: 'application/json',
                        text: JSON.stringify(session, null, 2)
                    }
                ]
            };
        }
        case 'flowlens://canvas-url': {
            return {
                contents: [
                    {
                        uri,
                        mimeType: 'text/plain',
                        text: `http://localhost:${port}`
                    }
                ]
            };
        }
        case 'flowlens://evidence/root-cause': {
            const rootCauseNode = session.nodes.find(n => n.id === session.rootCauseNodeId || n.state === 'STOPPED_HERE');
            if (!rootCauseNode) {
                return {
                    contents: [
                        {
                            uri,
                            mimeType: 'application/json',
                            text: JSON.stringify({
                                rootCauseFound: false,
                                message: 'Chưa có node nào được đánh dấu là STOPPED_HERE trong phiên điều tra hiện tại.',
                                sessionId: session.id,
                                endpoint: `${session.method} ${session.endpoint}`
                            }, null, 2)
                        }
                    ]
                };
            }
            return {
                contents: [
                    {
                        uri,
                        mimeType: 'application/json',
                        text: JSON.stringify({
                            rootCauseFound: true,
                            sessionId: session.id,
                            endpoint: `${session.method} ${session.endpoint}`,
                            nodeId: rootCauseNode.id,
                            nodeType: rootCauseNode.type,
                            label: rootCauseNode.label,
                            sublabel: rootCauseNode.sublabel,
                            file: rootCauseNode.file,
                            line: rootCauseNode.line,
                            state: rootCauseNode.state,
                            certainty: rootCauseNode.certainty,
                            confidence: rootCauseNode.confidence,
                            causalWhy: rootCauseNode.causalWhy || null,
                            codeEvidence: rootCauseNode.codeEvidence || null,
                            runtimeLogs: rootCauseNode.runtimeLogs || []
                        }, null, 2)
                    }
                ]
            };
        }
        case 'flowlens://pipeline/summary': {
            const passedNodes = session.nodes.filter(n => n.state === 'PASSED');
            const stoppedNodes = session.nodes.filter(n => n.state === 'STOPPED_HERE');
            const skippedNodes = session.nodes.filter(n => n.state === 'SKIPPED');
            const notVerifiedNodes = session.nodes.filter(n => n.state === 'NOT_VERIFIED');
            let markdown = `# 🔍 FlowLens Pipeline Execution Report\n\n`;
            markdown += `- **Endpoint:** \`${session.method} ${session.endpoint}\`\n`;
            markdown += `- **Session ID:** \`${session.id}\`\n`;
            markdown += `- **Status:** \`${session.status.toUpperCase()}\`\n`;
            markdown += `- **Certainty Score:** \`${Math.round(session.certaintyScore * 100)}%\`\n`;
            markdown += `- **Canvas URL:** [http://localhost:${port}](http://localhost:${port})\n\n`;
            markdown += `## 📊 Node Status Breakdown\n`;
            markdown += `- ✅ **Passed:** ${passedNodes.length}\n`;
            markdown += `- 🔴 **Stopped (Root Cause):** ${stoppedNodes.length}\n`;
            markdown += `- ⏭️ **Skipped:** ${skippedNodes.length}\n`;
            markdown += `- ❓ **Not Verified:** ${notVerifiedNodes.length}\n\n`;
            markdown += `## 🧭 Execution Flow Path\n`;
            session.nodes.forEach((n, idx) => {
                const badge = n.state === 'PASSED' ? '✅ PASSED' : n.state === 'STOPPED_HERE' ? '🔴 STOPPED_HERE' : n.state === 'SKIPPED' ? '⏭️ SKIPPED' : '⚪ NOT_VERIFIED';
                markdown += `${idx + 1}. **${n.label}** (\`${n.type}\`) - **${badge}**\n`;
                if (n.sublabel)
                    markdown += `   - *Detail:* ${n.sublabel}\n`;
                if (n.file)
                    markdown += `   - *Location:* \`${n.file}${n.line ? `:${n.line}` : ''}\`\n`;
                if (n.state === 'STOPPED_HERE' && n.causalWhy) {
                    markdown += `   - **Causal WHY:**\n`;
                    markdown += `     - *Condition:* ${n.causalWhy.condition}\n`;
                    markdown += `     - *Actual State:* ${n.causalWhy.actualState}\n`;
                    markdown += `     - *Verdict:* ${n.causalWhy.verdict}\n`;
                    if (n.causalWhy.recommendation) {
                        markdown += `     - *Recommendation:* ${n.causalWhy.recommendation}\n`;
                    }
                }
            });
            return {
                contents: [
                    {
                        uri,
                        mimeType: 'text/markdown',
                        text: markdown
                    }
                ]
            };
        }
        default:
            throw new Error(`FlowLens Resource not found: ${uri}`);
    }
}
