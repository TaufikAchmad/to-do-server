import { Tasks } from '../entity/Tasks';
import { MyContext } from '../types';
import { Resolver, Query, Ctx, Int, Arg, Mutation } from 'type-graphql';

@Resolver()
export class TaskResolver {
  @Query(() => [Tasks])
  tasks(
    @Ctx() { em }: MyContext
  ): Promise<Tasks[]> {
    return em.find(Tasks, {});
  }

  @Query(() => [Tasks], {nullable: true})
  task(
    @Arg('id', () => Int) id: number,
    @Ctx() { em }: MyContext
  ): Promise<Tasks[]> {
    return em.findBy(Tasks, { id });
  }

  @Mutation(() => Tasks)
  async createTask(
    @Arg('taskTitle') title: string,
    @Arg('description', {nullable: true}) description: string,
    @Ctx()  { em }: MyContext
  ): Promise<Tasks> {
    const task = em.create(Tasks, { title, description });
    await em.save(task);
    return task;
  }

  @Mutation(() => Tasks)
  async updateTask(
    @Arg('id', () => Int) id: number,
    @Arg('taskTitle', {nullable: true}) title: string,
    @Arg('description', {nullable: true}) description: string,
    @Ctx() { em }: MyContext
  ): Promise<Tasks | undefined> {
    const task = await em.preload(Tasks, {id, title, description})
    await em.save(task);
    return task;
  }

  @Mutation(() => String)
  async deleteTask(
    @Arg('id', () => Int) id: number,
    @Ctx() { em }: MyContext
  ): Promise<string> {
    const result = await em.delete(Tasks, id)
    return `success delete ${result.affected} data`
  }
}