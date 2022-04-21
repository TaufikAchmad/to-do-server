import 'reflect-metadata';
import 'dotenv-safe/config';
import { SESSION_NAME, __prod__ } from './constants';
import ormConfig from './ormconfig';
import express from 'express';

import { ApolloServer, UserInputError } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { TaskResolver } from './resolvers/tasks';
import { UserResolver } from './resolvers/users';
import { DataSource } from 'typeorm/data-source/DataSource';

import { createClient } from 'redis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import cors from 'cors';
import * as joiful from 'joiful';

const main = async () => {
  const AppDataSource = new DataSource(ormConfig);
  console.log(`Connecting to ${process.env.DATABASE_TYPE} db`);
  AppDataSource.initialize()
    .then(() => {
      console.log(
        `Data Source has been initialized to ${process.env.DATABASE_TYPE}!`
      );
    })
    .catch((err) => {
      console.error('Error during Data Source initialization', err);
    });

  const app = express();

  app.set('trust proxy', !__prod__);
  app.set('Access-Control-Allow-Origin', 'https://studio.apollographql.com'); // to allow cookies on apollo studio

  const RedisStore = connectRedis(session);
  let redisClient = createClient({
    legacyMode: true,
    url: process.env.REDIS_URL,
    password: process.env.REDIS_PASSWORD,
  });
  redisClient
    .connect()
    .then(() => console.log('Success connect to Redis'))
    .catch(console.error);

  app.use(
    cors({
      credentials: true,
      origin: new RegExp(
        'https://studio.apollographql.com|http://localhost:3000'
      ),
    })
  );

  app.use(
    session({
      name: SESSION_NAME,
      store: new RedisStore({
        client: redisClient as any,
        disableTouch: true,
        disableTTL: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, //10 years
        httpOnly: true,
        sameSite: 'lax', // set to 'lax' and secure false for set cookies to UI client (localhost:3000), otherwise set to 'none'
        secure: false, // if true, studio works, postman doesn't; if false its the other way around
      },
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET,
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [TaskResolver, UserResolver],
      validate: (argValue, _) => {
        const { error } = joiful.validate(argValue);
        if (error?.details) {
          const validationErrors = error.details.map((err) => {
            return {
              field: err.context?.key,
              message: err.message,
            };
          });
          throw new UserInputError('Invalid argument value', {
            validationErrors,
          });
        }
      },
    }),
    context: ({ req, res }) => ({ em: AppDataSource.manager, req, res }),
  });

  await apolloServer.start();

  apolloServer.applyMiddleware({ app, cors: false });

  app.listen(process.env.APP_PORT, () => {
    console.log(`server started on localhost:${process.env.APP_PORT}`);
  });
};

main().catch((err) => {
  console.error(err);
});
