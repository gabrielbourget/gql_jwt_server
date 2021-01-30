import { Arg, Mutation, Query, Resolver } from "type-graphql";

@Resolver()
export class UserResolver {
  @Query(() => String)
  hello() {
    return "server is working dawg";
  }

  @Mutation(() => Boolean)
  register(
    @Arg("email") _email: string,
    @Arg("password") _password: string,
  ) {
    return
  }
}