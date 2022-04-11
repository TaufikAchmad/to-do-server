import { EntityManager } from "typeorm/entity-manager/EntityManager"

export type MyContext = {
  em: EntityManager
}