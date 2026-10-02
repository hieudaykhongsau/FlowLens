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
export declare class JwtDecoder {
    /**
     * Giải mã Base64URL không cần thư viện ngoài (sử dụng Buffer có sẵn trong Node.js)
     */
    private static base64UrlDecode;
    /**
     * Giải mã và trích xuất claims, roles, expiration từ token JWT
     */
    static decode(rawToken: string): DecodedJwt;
}
