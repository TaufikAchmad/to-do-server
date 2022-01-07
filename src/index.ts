import "reflect-metadata";
import "dotenv-safe/config";
import { __prod__ } from "./constants";
import { createConnection } from 'typeorm'
import ormConfig from "./ormconfig";

createConnection(ormConfig)
.then(connection => {
  console.log("Connection:", connection.isConnected);
}).catch(error => console.error(error))

console.log("Hello there, this is changes", __prod__);