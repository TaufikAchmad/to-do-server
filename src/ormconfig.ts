import { createConnection } from "typeorm";

export default {
   "type": process.env.DATABASE_TYPE,
   "host": process.env.DATABASE_URL,
   "port": process.env.DATABASE_PORT,
   "username": process.env.DATABASE_USERNAME,
   "password": process.env.DATABASE_PASSWORD,
   "database": process.env.DB,
   "synchronize": true,
   "logging": ["error"],
   "entities": [
      "dist/entity/**/*.js"
   ],
   "migrations": [
      "dist/migration/**/*.js"
   ],
   "subscribers": [
      "dist/subscriber/**/*.js"
   ],
   "cli": {
      "entitiesDir": "src/entity",
      "migrationsDir": "src/migration",
      "subscribersDir": "src/subscriber"
   }
} as Parameters<typeof createConnection>[0];