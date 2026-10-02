import { CurlParser } from '../../parser/curlParser.js';

export async function handleParseCurlRequest(args: { curlCommand: string }) {
  if (!args.curlCommand) {
    throw new Error('Tham số curlCommand không được để trống.');
  }

  const parsed = CurlParser.parse(args.curlCommand);

  let jwtAnalysis: any = {
    present: false
  };

  if (parsed.jwt) {
    jwtAnalysis = {
      present: true,
      isValid: parsed.jwt.isValidJwt,
      subject: parsed.jwt.subject || 'N/A',
      roles: parsed.jwt.roles,
      isExpired: parsed.jwt.isExpired,
      issuedAt: parsed.jwt.issuedAt,
      expiresAt: parsed.jwt.expiresAt,
      header: parsed.jwt.header,
      payload: parsed.jwt.payload,
      error: parsed.jwt.error
    };
  }

  let securityWarning: string | null = null;
  if (parsed.jwt?.isExpired) {
    securityWarning = 'CẢNH BÁO: Token JWT này ĐÃ HẾT HẠN (Expired). Request có thể bị từ chối 401 Unauthorized ngay tại JwtAuthenticationFilter.';
  } else if (parsed.jwt?.isValidJwt && parsed.jwt.roles.length === 0) {
    securityWarning = 'CHÚ Ý: Token JWT không chứa bất kỳ Claim Role / Authority nào. Nếu API có rào chắn RBAC (@PreAuthorize / Guard), request sẽ bị 403 Forbidden.';
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            status: 'success',
            endpoint: parsed.endpoint,
            method: parsed.method,
            url: parsed.url,
            queryParams: parsed.queryParams,
            headers: parsed.headers,
            body: parsed.body,
            jwtAnalysis,
            securityWarning,
            recommendation: `Đã bóc tách thành công! Bạn có thể gọi tool \`trace_endpoint_pipeline\` với endpoint "${parsed.endpoint}" và method "${parsed.method}" để phân tích sâu AST.`
          },
          null,
          2
        )
      }
    ]
  };
}
