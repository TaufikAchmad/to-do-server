import { Users } from '../entity/Users';
import { MyContext } from '../types';
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from 'type-graphql';
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
  field?: string;

  @Field()
  message?: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => Users, { nullable: true })
  user?: Users;
}

@Resolver()
export class UserResolver {
  @Query(() => Users, { nullable: true })
  async me(@Ctx() { em, req }: MyContext): Promise<Users | null> {
    // not logged in
    if (!req.session.userId) {
      return null;
    }

    const user = await em.findBy(Users, { id: req.session.userId });

    return user[0];
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('options') { username, password }: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    if (!username) {
      return {
        errors: [{ field: 'username', message: 'username cannot be empty!' }],
      };
    }

    if (!password) {
      return {
        errors: [{ field: 'password', message: 'password cannot be empty!' }],
      };
    }

    const hashedPassword = await argon2.hash(password, { type: argon2d });
    const user = em.create(Users, {
      username,
      password: hashedPassword,
    });

    try {
      await em.save(user);

      // logged in after register by set cookies
      req.session.userId = user.id;

      return { user };
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return {
          errors: [{ field: 'username', message: 'username already taken!' }],
        };
      }
      return { errors: [{ field: 'error query', message: err.code }] };
    }
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('options') { username, password }: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    try {
      if (!username) {
        return {
          errors: [{ field: 'username', message: 'username cannot be empty!' }],
        };
      }

      if (!password) {
        return {
          errors: [{ field: 'password', message: 'password cannot be empty!' }],
        };
      }

      let user = await em.findOne(Users, { where: { username } });
      if (!user) {
        return {
          errors: [{ field: 'username', message: 'username not found!' }],
        };
      }

      const valid = await argon2.verify(user.password, password, {
        type: argon2d,
      });
      if (!valid) {
        return {
          errors: [{ field: 'password', message: 'incorrect password!' }],
        };
      }

      req.session.userId = user.id;

      return { user };
    } catch (err) {
      return { errors: [{ field: 'error query', message: err.code }] };
    }
  }
}
