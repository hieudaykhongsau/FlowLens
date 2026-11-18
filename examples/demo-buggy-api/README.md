# FlowLens Reproducible Demo (`demo-buggy-api`)

Project mẫu nhỏ để kiểm chứng khả năng phân tích tĩnh và đọc log an toàn của FlowLens:

1. `ordersController.ts`: Chứa route `POST /api/v1/orders` với kiểm tra quyền `ROLE_ADMIN`.
2. `app.log`: Chứa log mẫu có JWT token (để kiểm chứng `SandboxDispatcher.redactSecrets`) và stack trace trỏ về `ordersController.ts:8:19`.

Chạy kiểm thử tự động từ thư mục gốc:

```bash
npm install
npm test
```
