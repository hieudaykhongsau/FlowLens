import { DecodedJwt } from './jwtDecoder.js';
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
export declare class CurlParser {
    /**
     * Tách các argument của dòng lệnh shell có xử lý dấu ngoặc kép đơn/kép và dấu gạch chéo ngược
     */
    static tokenize(command: string): string[];
    /**
     * Phân tích cú pháp lệnh cURL đầy đủ
     */
    static parse(command: string): ParsedCurlRequest;
}
