import "reflect-metadata";
import "dotenv-safe/config";
import { __prod__ } from "./constants";
import {  } from 'typeorm'
import ormConfig from "./ormconfig";

import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from 'type-graphql';
import { TaskResolver } from "./resolvers/tasks-resolver";
import { DataSource } from "typeorm/data-source/DataSource";

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

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [TaskResolver],
      validate: false,
    }),
    context: () => ({ em: AppDataSource.manager })
  })

  await apolloServer.start()

  apolloServer.applyMiddleware({ app })

  app.listen(3000, () => {
    console.log('server started on localhost:3000')
  });
}

main().catch((err) => {
  console.error(err);
})