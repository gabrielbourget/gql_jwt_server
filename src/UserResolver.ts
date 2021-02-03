// -> Beyond codebase
import { compare, hash } from "bcryptjs";
import {
  Arg, Ctx, Field, Int, Mutation, ObjectType, Query, Resolver, UseMiddleware
} from "type-graphql";
import { getConnection } from "typeorm";
import { verify } from "jsonwebtoken";
// -> Within codebase
import { User } from "./entity/User";
import { Context } from "./Types/Context";
import {
  createAccessToken, createRefreshToken, isAuthorized, setRefreshTokenCookie
} from "./helpers";

const { ACCESS_TOKEN_SECRET } = process.env;
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
  
  @Query(() => String)
  @UseMiddleware(isAuthorized)
  currentUserId(@Ctx() { payload }: Context) {
    return `Current user ID is ${payload?.userId}`;
  }

  @Query(() => [User])
  @UseMiddleware(isAuthorized)
  users() {
    return User.find();
  }

  @Query(() => User, { nullable: true })
  @UseMiddleware(isAuthorized) // - DEV NOTE -> Could be overkill to have auth logic in the function if it has to be authorized.
  async Me (@Ctx() context: Context) {
    const authorization = context.req.headers["authorization"];

    if (!authorization) return null;

    try {
      const token = authorization.split(" ")[1];
      const payload: any = verify(token, ACCESS_TOKEN_SECRET!);
      return await User.findOne(payload.userId);
      return 
    } catch (err) {
      console.log(err);
      return null;
    }
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
    @Arg("password") password: string,
    @Ctx() { res }: Context
  ): Promise<LoginResponse> {
    const user = await User.findOne({ where: { email }});
    if (!user) throw new Error("Could not find user");

    const passwordValid = await compare(password, user.password);
    if (!passwordValid) throw new Error("Invalid password");

    setRefreshTokenCookie(res, createRefreshToken(user));

    return { accessToken: createAccessToken(user) };
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() { res }: Context) {
    setRefreshTokenCookie(res, "");
    return true;
  }

  @Mutation(() => Boolean)
  async revokeRefreshTokensForUser(
    @Arg("userId", () => Int) userId: number
  ) {
    await getConnection()
      .getRepository(User)
      .increment({ id: userId }, "tokenVersion", 1)

    return true;
  }
}
