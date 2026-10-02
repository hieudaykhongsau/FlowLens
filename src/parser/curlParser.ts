import { DecodedJwt, JwtDecoder } from './jwtDecoder.js';

export interface ParsedCurlRequest {
  rawCommand: string;
  method: string;
  url: string;
  endpoint: string;
  queryParams: Record<string, string>;
  headers: Record<string, string>;
  body?: any;
  rawBody?: string;
  jwt?: DecodedJwt;
  basicAuth?: {
    username: string;
    password?: string;
  };
}

export class CurlParser {
  /**
   * Tách các argument của dòng lệnh shell có xử lý dấu ngoặc kép đơn/kép và dấu gạch chéo ngược
   */
  public static tokenize(command: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let escapeNext = false;

    // Loại bỏ các dòng nối dấu gạch chéo ngược '\ \n'
    const normalized = command.replace(/\\\r?\n/g, ' ').trim();

    for (let i = 0; i < normalized.length; i++) {
      const char = normalized[i];

      if (escapeNext) {
        current += char;
        escapeNext = false;
        continue;
      }

      if (char === '\\' && !inSingleQuote) {
        escapeNext = true;
        continue;
      }

      if (char === "'" && !inDoubleQuote) {
        inSingleQuote = !inSingleQuote;
        continue;
      }

      if (char === '"' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
        continue;
      }

      if (/\s/.test(char) && !inSingleQuote && !inDoubleQuote) {
        if (current.length > 0) {
          tokens.push(current);
          current = '';
        }
        continue;
      }

      current += char;
    }

    if (current.length > 0) {
      tokens.push(current);
    }

    return tokens;
  }

  /**
   * Phân tích cú pháp lệnh cURL đầy đủ
   */
  public static parse(command: string): ParsedCurlRequest {
    const tokens = CurlParser.tokenize(command);

    let method = '';
    let rawUrl = '';
    const headers: Record<string, string> = {};
    const dataParts: string[] = [];
    let basicAuth: { username: string; password?: string } | undefined;

    let i = 0;
    while (i < tokens.length) {
      const token = tokens[i];

      if (token === 'curl') {
        i++;
        continue;
      }

      // Method: -X POST, --request POST
      if (token === '-X' || token === '--request') {
        if (i + 1 < tokens.length) {
          method = tokens[i + 1].toUpperCase();
          i += 2;
          continue;
        }
      }

      // Header: -H "Authorization: Bearer ...", --header "..."
      if (token === '-H' || token === '--header') {
        if (i + 1 < tokens.length) {
          const headerStr = tokens[i + 1];
          const colonIdx = headerStr.indexOf(':');
          if (colonIdx > 0) {
            const key = headerStr.slice(0, colonIdx).trim().toLowerCase();
            const val = headerStr.slice(colonIdx + 1).trim();
            headers[key] = val;
          }
          i += 2;
          continue;
        }
      }

      // Data / Body: -d, --data, --data-raw, --data-binary, --data-urlencode
      if (
        token === '-d' ||
        token === '--data' ||
        token === '--data-raw' ||
        token === '--data-binary' ||
        token === '--data-urlencode'
      ) {
        if (i + 1 < tokens.length) {
          dataParts.push(tokens[i + 1]);
          i += 2;
          continue;
        }
      }

      // Basic Auth: -u "username:password", --user "..."
      if (token === '-u' || token === '--user') {
        if (i + 1 < tokens.length) {
          const authStr = tokens[i + 1];
          const colonIdx = authStr.indexOf(':');
          if (colonIdx >= 0) {
            basicAuth = {
              username: authStr.slice(0, colonIdx),
              password: authStr.slice(colonIdx + 1)
            };
          } else {
            basicAuth = { username: authStr };
          }
          i += 2;
          continue;
        }
      }

      // Positional URL
      if (!token.startsWith('-') && !rawUrl) {
        rawUrl = token;
      }

      i++;
    }

    // Xác định Endpoint và Query Parameters từ URL
    let endpoint = '/';
    const queryParams: Record<string, string> = {};

    if (rawUrl) {
      try {
        // Hỗ trợ trường hợp chỉ truyền path: /api/v1/users hoặc URL hoàn chỉnh: http://...
        const parsedUrl = rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
          ? new URL(rawUrl)
          : new URL(`http://localhost${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`);

        endpoint = parsedUrl.pathname;
        parsedUrl.searchParams.forEach((val, key) => {
          queryParams[key] = val;
        });
      } catch {
        // Fallback đơn giản nếu URL không chuẩn
        const [pathPart, queryPart] = rawUrl.split('?');
        endpoint = pathPart.replace(/^https?:\/\/[^/]+/, '') || '/';
        if (queryPart) {
          const pairs = queryPart.split('&');
          for (const p of pairs) {
            const [k, v] = p.split('=');
            if (k) queryParams[decodeURIComponent(k)] = decodeURIComponent(v || '');
          }
        }
      }
    }

    // Tự động suy luận HTTP Method nếu chưa có
    if (!method) {
      if (dataParts.length > 0) {
        method = 'POST';
      } else {
        method = 'GET';
      }
    }

    // Xử lý Body
    let body: any = undefined;
    let rawBody: string | undefined = undefined;

    if (dataParts.length > 0) {
      rawBody = dataParts.join('&');
      try {
        body = JSON.parse(rawBody);
      } catch {
        // Không phải JSON, giữ dạng text hoặc urlencoded
        body = rawBody;
      }
    }

    // Tự động bóc tách & giải mã JWT từ Authorization Header
    let jwt: DecodedJwt | undefined = undefined;
    const authHeader = headers['authorization'] || headers['auth'];

    if (authHeader) {
      if (/^Bearer\s+/i.test(authHeader)) {
        const token = authHeader.replace(/^Bearer\s+/i, '').trim();
        jwt = JwtDecoder.decode(token);
      } else if (/^Basic\s+/i.test(authHeader)) {
        try {
          const decoded = Buffer.from(authHeader.replace(/^Basic\s+/i, ''), 'base64').toString('utf-8');
          const [u, p] = decoded.split(':');
          basicAuth = { username: u, password: p };
        } catch {
          // Bỏ qua nếu lỗi
        }
      }
    }

    return {
      rawCommand: command,
      method,
      url: rawUrl || endpoint,
      endpoint,
      queryParams,
      headers,
      body,
      rawBody,
      jwt,
      basicAuth
    };
  }
}
