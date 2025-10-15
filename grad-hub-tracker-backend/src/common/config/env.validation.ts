export type AppEnv = {
  GOOGLE_CLIENT_ID: string;
  JWT_SECRET: string;
  ADMIN_EMAILS?: string;
  DATABASE_URL: string;
  UPLOAD_DIR?: string;
  FRONTEND_ORIGIN?: string;
  PORT?: string | number;
  NODE_ENV?: 'development' | 'production' | 'test';
};

export function validateEnv(config: Record<string, unknown>): AppEnv {
  const get = (key: keyof AppEnv, required = false): string | undefined => {
    const v = config[key as string];
    if ((v === undefined || v === null || v === '') && required) {
      throw new Error(`Missing environment variable: ${String(key)}`);
    }
    return typeof v === 'string' ? v : undefined;
  };

  const GOOGLE_CLIENT_ID = get('GOOGLE_CLIENT_ID', true)!;
  const JWT_SECRET = get('JWT_SECRET', true)!;
  const DATABASE_URL = get('DATABASE_URL', true)!;

  const env: AppEnv = {
    GOOGLE_CLIENT_ID,
    JWT_SECRET,
    ADMIN_EMAILS: get('ADMIN_EMAILS'),
    DATABASE_URL,
    UPLOAD_DIR: get('UPLOAD_DIR') ?? './uploads',
    FRONTEND_ORIGIN: get('FRONTEND_ORIGIN'),
    PORT: ((): number => {
      const raw = get('PORT');
      const n = typeof raw === 'string' ? Number(raw) : Number(raw);
      return Number.isFinite(n) && n > 0 ? n : 3000;
    })(),
    NODE_ENV: ((): 'development' | 'production' | 'test' => {
      const v = get('NODE_ENV');
      return v === 'production' || v === 'test' ? v : 'development';
    })(),
  };

  return env;
}
