import { Users } from "../entity/Users";
import { MyContext } from "../types";
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Resolver } from "type-graphql";
import argon2, { argon2d } from 'argon2';

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string;

  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;

  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], {nullable: true})
  errors?: FieldError[];

  @Field(() => Users, {nullable: true})
  user?: Users;
}

@Resolver()
export class UserResolver {
  @Mutation(() => UserResponse)
  async register(
    @Arg('options') {username, password}: UsernamePasswordInput,
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {

    const hashedPassword = await argon2.hash(password, {type: argon2d});
    const user = em.create(Users, {
      username,
      password: hashedPassword
    });

    try {
      await em.save(user);
      return {user}
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return {errors: [{ field: 'username', message: 'username already taken!' }]}
      }
      return {errors: [{ field: 'error query', message: err.code }]}
    }
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('options') {username, password}: UsernamePasswordInput,
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {
    try {
      let user = await em.findOne(Users, { where: {username} });
      if (!user) {
        return {errors: [{ field: 'username', message: 'username not found!' }]}
      }

      const valid = await argon2.verify(user.password, password, {type: argon2d})
      if (!valid) {
        return {errors: [{ field: 'password', message: 'incorrect password!' }]}
      }

      return {user}
    } catch (err) {
      return {errors: [{ field: 'error query', message: err.code }]}
    }
  }
}