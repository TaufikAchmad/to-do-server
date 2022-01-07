declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;
    DATABASE_PORT: number;
    DATABASE_USERNAME: string;
    DATABASE_PASSWORD: string;
    DB: string;
    DATABASE_TYPE: string;
  }
}