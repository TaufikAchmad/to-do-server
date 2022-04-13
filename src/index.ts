import "reflect-metadata";
import "dotenv-safe/config";
import { __prod__ } from "./constants";
import ormConfig from "./ormconfig";
import express from "express";

import { ApolloServer } from "apollo-server-express";
import { buildSchema } from 'type-graphql';
import { TaskResolver } from "./resolvers/tasks";
import { UserResolver } from "./resolvers/users";
import { DataSource } from "typeorm/data-source/DataSource";

import { createClient } from "redis";
import session from "express-session";
import connectRedis from "connect-redis";

console.log(`Connecting to ${process.env.DATABASE_TYPE} db`)

const main = async () => {
  const AppDataSource = new DataSource(ormConfig)
  AppDataSource.initialize()
    .then(() => {
        console.log(`Data Source has been initialized to ${process.env.DATABASE_TYPE}!`)
    })
    .catch((err) => {
        console.error("Error during Data Source initialization", err)
    })

  const app = express();

  app.set("trust proxy", !__prod__);
  app.set("Access-Control-Allow-Origin", "https://studio.apollographql.com");
  app.set("Access-Control-Allow-Credentials", true);

  const RedisStore = connectRedis(session);
  let redisClient = createClient({
    legacyMode: true,
    url: process.env.REDIS_URL,
    password: process.env.REDIS_PASSWORD,
  })
  redisClient.connect()
    .then(() => console.log('Success connect to Redis'))
    .catch(console.error)

  app.use(
    session({
      name: process.env.SESSION_NAME,
      store: new RedisStore({
        client: redisClient as any,
        disableTouch: true,
        disableTTL: true
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, //10 years
        httpOnly: true,
        sameSite: 'none',
        secure: true // if true, studio works, postman doesn't; if false its the other way around
      },
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET,
      resave: false,
    })
  )

  // app.use((req) => {
  //   console.log('here', req.session)
  // })

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [TaskResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({ em: AppDataSource.manager, req, res })
  })

  await apolloServer.start()

  const cors = {
    credentials: true,
    origin: 'https://studio.apollographql.com'
  }

  apolloServer.applyMiddleware({ app, cors })

  app.listen(3000, () => {
    console.log('server started on localhost:3000')
  });
}

main().catch((err) => {
  console.error(err);
})