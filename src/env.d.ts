declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;
    DATABASE_PORT: number;
    DATABASE_USERNAME: string;
    DATABASE_PASSWORD: string;
    DB: string;
    DATABASE_TYPE: string;
    REDIS_URL: string;
    REDIS_PASSWORD: string;
    SESSION_NAME: string;
    SESSION_SECRET: string;
    APP_PORT: string;
  }
}
