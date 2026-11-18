const LOCAL_ORIGIN_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

/**
 * Kiểm tra Origin có phải từ máy local (localhost / 127.0.0.1 / [::1]) hay không.
 */
export function isLocalOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  return LOCAL_ORIGIN_REGEX.test(origin.trim());
}

/**
 * Chuẩn hóa host bind mặc định về 127.0.0.1 để tránh mở ra mạng LAN.
 */
export function resolveBindHost(envHost?: string): string {
  const trimmed = (envHost || '').trim();
  return trimmed || '127.0.0.1';
}
