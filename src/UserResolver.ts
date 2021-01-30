import { compare, hash } from "bcryptjs";
import { User } from "./entity/User";
import { sign } from "jsonwebtoken"
import {
  Arg, Field, Mutation, ObjectType, Query, Resolver
} from "type-graphql";


@ObjectType()
class LoginResponse {
  @Field()
  accessToken: string;
}

@Resolver()
export class UserResolver {
  @Query(() => String)
  hello() {
    return "server is working dawg";
  }

  @Query(() => [User])
  users() {
    return User.find();
  }

  @Mutation(() => Boolean)
  async register(
    @Arg("email") email: string,
    @Arg("password") password: string,
  ) {
    const hashedPassword = await hash(password, 12);

    try {
      await User.insert({ email, password: hashedPassword });
    } catch (err) {
      console.log(err);
      return false;
    }

    return true;
  }

  @Mutation(() => LoginResponse)
  async login(
    @Arg("email") email: string,
    @Arg("password") password: string
  ): Promise<LoginResponse> {
    const user = await User.findOne({ where: { email }});

    if (!user) throw new Error("Could not find user");

    const passwordValid = await compare(password, user.password);

    if (!passwordValid) throw new Error("Invalid password");

    return {
      accessToken: sign(
        { userId: user.id, email: user.email },
        "asdfasdfasdf",
        { expiresIn: "15m"}
      )
    };
  }
}