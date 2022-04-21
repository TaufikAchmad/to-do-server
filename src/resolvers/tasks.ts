import { Tasks } from '../entity/Tasks';
import { MyContext } from '../types';
import {
  Resolver,
  Query,
  Ctx,
  Int,
  Arg,
  Mutation,
  InputType,
  Field,
} from 'type-graphql';
import * as Joiful from 'joiful';

@InputType()
class CreateTaskInput {
  @Field(() => String)
  @Joiful.string().required().max(100)
  title: string;

  @Field(() => String, { nullable: true })
  @Joiful.string().optional().allow([null, ''])
  description?: string;
}

@InputType()
class UpdateTaskInput {
  @Field(() => Int)
  @Joiful.number().required()
  id: number;

  @Field(() => String, { nullable: true })
  @Joiful.string().optional().max(100)
  title?: string;

  @Field(() => String, { nullable: true })
  @Joiful.string().optional().allow([null, ''])
  description?: string;
}
@Resolver()
export class TaskResolver {
  @Query(() => [Tasks])
  tasks(@Ctx() { em }: MyContext): Promise<Tasks[]> {
    return em.find(Tasks, {});
  }

  @Query(() => Tasks, { nullable: true })
  task(
    @Arg('id', () => Int) id: number,
    @Ctx() { em }: MyContext
  ): Promise<Tasks | null> {
    return em.findOneBy(Tasks, { id });
  }

  @Mutation(() => Tasks)
  async createTask(
    @Arg('options') { title, description }: CreateTaskInput,
    @Ctx() { em }: MyContext
  ): Promise<Tasks> {
    const task = em.create(Tasks, { title, description });
    await em.save(task);
    return task;
  }

  @Mutation(() => Tasks)
  async updateTask(
    @Arg('options') { id, title, description }: UpdateTaskInput,
    @Ctx() { em }: MyContext
  ): Promise<Tasks | undefined> {
    const task = await em.preload(Tasks, { id, title, description });
    await em.save(task);
    return task;
  }

  @Mutation(() => String)
  async deleteTask(
    @Arg('id', () => Int) id: number,
    @Ctx() { em }: MyContext
  ): Promise<string> {
    const result = await em.delete(Tasks, id);
    return `success delete ${result.affected} data`;
  }
}
