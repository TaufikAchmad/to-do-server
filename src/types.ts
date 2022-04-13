import { EntityManager } from "typeorm/entity-manager/EntityManager"
import { Request, Response } from "express";
import { SessionData } from "express-session"

export type MyContext = {
  em: EntityManager,
  req: Request & { session: SessionData & { userId: number } },
  res: Response
}