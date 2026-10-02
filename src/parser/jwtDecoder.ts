export interface DecodedJwt {
  isValidJwt: boolean;
  header?: Record<string, any>;
  payload?: Record<string, any>;
  subject?: string;
  roles: string[];
  issuedAt?: string;
  expiresAt?: string;
  isExpired?: boolean;
  rawToken: string;
  error?: string;
}

export class JwtDecoder {
  /**
   * Giải mã Base64URL không cần thư viện ngoài (sử dụng Buffer có sẵn trong Node.js)
   */
  private static base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return Buffer.from(base64, 'base64').toString('utf-8');
  }

  /**
   * Giải mã và trích xuất claims, roles, expiration từ token JWT
   */
  public static decode(rawToken: string): DecodedJwt {
    if (!rawToken || typeof rawToken !== 'string') {
      return {
        isValidJwt: false,
        rawToken: '',
        roles: [],
        error: 'Token rỗng hoặc không phải chuỗi ký tự'
      };
    }

    const cleanToken = rawToken.trim().replace(/^Bearer\s+/i, '');
    const parts = cleanToken.split('.');

    if (parts.length !== 3) {
      return {
        isValidJwt: false,
        rawToken: cleanToken,
        roles: [],
        error: `Chuỗi không đúng cấu trúc JWT 3 phần header.payload.signature (nhận được ${parts.length} phần)`
      };
    }

    try {
      const headerJson = JwtDecoder.base64UrlDecode(parts[0]);
      const payloadJson = JwtDecoder.base64UrlDecode(parts[1]);

      const header = JSON.parse(headerJson);
      const payload = JSON.parse(payloadJson);

      // Trích xuất Subject
      const subject = payload.sub || payload.subject || payload.userId || payload.user_id || payload.username;

      // Trích xuất Roles / Permissions hỗ trợ nhiều quy ước Framework (Spring Security, Keycloak, Auth0, Cognito)
      const roles: string[] = [];

      // 1. Spring Security convention: roles: ["ROLE_..."] hoặc authorities: ["ROLE_..."]
      const directRoles = payload.roles || payload.authorities || payload.role || payload.auth;
      if (Array.isArray(directRoles)) {
        for (const r of directRoles) {
          if (typeof r === 'string') {
            roles.push(r);
          } else if (r && typeof r === 'object' && r.authority) {
            roles.push(String(r.authority));
          }
        }
      } else if (typeof directRoles === 'string') {
        roles.push(directRoles);
      }

      // 2. Keycloak realm_access / resource_access convention
      if (payload.realm_access && Array.isArray(payload.realm_access.roles)) {
        for (const r of payload.realm_access.roles) {
          if (!roles.includes(r)) roles.push(r);
        }
      }

      // 3. OAuth2 / OpenID Scope convention (scope: "read write admin")
      if (payload.scope && typeof payload.scope === 'string') {
        for (const s of payload.scope.split(/\s+/)) {
          if (s && !roles.includes(s)) roles.push(s);
        }
      }

      // 4. AWS Cognito groups
      if (Array.isArray(payload['cognito:groups'])) {
        for (const g of payload['cognito:groups']) {
          if (!roles.includes(g)) roles.push(g);
        }
      }

      // 5. Auth0 permissions
      if (Array.isArray(payload.permissions)) {
        for (const p of payload.permissions) {
          if (!roles.includes(p)) roles.push(p);
        }
      }

      // Tính toán Expiration & IssuedAt
      let issuedAt: string | undefined;
      let expiresAt: string | undefined;
      let isExpired: boolean | undefined;

      const nowSec = Math.floor(Date.now() / 1000);

      if (payload.iat && typeof payload.iat === 'number') {
        issuedAt = new Date(payload.iat * 1000).toISOString();
      }

      if (payload.exp && typeof payload.exp === 'number') {
        expiresAt = new Date(payload.exp * 1000).toISOString();
        isExpired = nowSec > payload.exp;
      }

      return {
        isValidJwt: true,
        header,
        payload,
        subject,
        roles,
        issuedAt,
        expiresAt,
        isExpired,
        rawToken: cleanToken
      };
    } catch (err: any) {
      return {
        isValidJwt: false,
        rawToken: cleanToken,
        roles: [],
        error: `Không thể giải mã nội dung JWT: ${err.message}`
      };
    }
  }
}
