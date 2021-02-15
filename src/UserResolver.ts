// -> Beyond codebase
import { compare, hash } from "bcryptjs";
import {
  Arg, Ctx, Field, Int, Mutation, ObjectType,
  Query, Resolver, UseMiddleware
} from "type-graphql";
import { getConnection } from "typeorm";
import { verify } from "jsonwebtoken";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
// import { authenticator } from "otplib";
// -> Within codebase
import { User } from "./entity/User";
import { Context } from "./Types/Context";
import {
  createAccessToken, createRefreshToken, isAuthenticated, setRefreshTokenCookie
} from "./helpers";
import { REFRESH_TOKEN_COOKIE_KEY, APP_NAME } from "./constants";
// import { NUM_BYTES_TOTP_SECRET } from "./constants";
import { generateOTPAuthURL } from "./helpers/generateOTPAuthURL";
// import { ITOTPSecret } from "./Types";

const { ACCESS_TOKEN_SECRET } = process.env;
@ObjectType()
class LoginResponse {
  @Field()
  accessToken: string;
}

@ObjectType()
class EnableMFAResponse {
  @Field()
  secret: string;

  @Field()
  QRCodeURL: string;
}

@Resolver()
export class UserResolver {

  // --------- //
  // - HELLO - //
  // --------- //
  @Query(() => String)
  hello() {
    return "server is working dawg";
  }


  // ------------------- //
  // - CURRENT USER ID - //
  // ------------------- //
  @Query(() => String)
  @UseMiddleware(isAuthenticated)
  currentUserId(@Ctx() { payload }: Context) {
    return `Current user ID is ${payload?.userId}`;
  }


  // --------- //
  // - USERS - //
  // --------- //
  @Query(() => [User])
  @UseMiddleware(isAuthenticated)
  users() {
    return User.find();
  }


  // --------------------- //
  // - ME (Current user) - //
  // --------------------- //
  @Query(() => User, { nullable: true })
  @UseMiddleware(isAuthenticated)
  async Me (@Ctx() context: Context) {
    const authorization = context.req.headers["authorization"];

    if (!authorization) return null;

    try {
      const token = authorization.split(" ")[1];
      const payload: any = verify(token, ACCESS_TOKEN_SECRET!);
      return await User.findOne(payload.userId);
    } catch (err) {
      console.log(err);
      return null;
    }
  }


  // ---------------- //
  // - REGISTRATION - //
  // ---------------- //
  @Mutation(() => Boolean)
  async register(
    @Arg("email") email: string,
    @Arg("password") password: string,
  ) {
    const hashedPassword = await hash(password, 12);

    try {
      await User.insert({
        email,
        password: hashedPassword,
        tokenVersion: 0,
      });
    } catch (err) {
      console.log(err);
      return false;
    }

    return true;
  }


  // --------- //
  // - LOGIN - //
  // --------- //
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


  // ---------- //
  // - LOGOUT - //
  // ---------- //
  @Mutation(() => Boolean)
  async logout(@Ctx() { res }: Context) {
    console.log("In Logout()");
    setRefreshTokenCookie(res, "");
    res.clearCookie(REFRESH_TOKEN_COOKIE_KEY);
    return true;
  }


  // -------------------------------------- //
  // - REVOKE ALL REFRESH TOKENS FOR USER - //
  // -------------------------------------- //
  @Mutation(() => Boolean)
  async revokeRefreshTokensForUser(
    @Arg("userId", () => Int) userId: number
  ) {
    await getConnection()
      .getRepository(User)
      .increment({ id: userId }, "tokenVersion", 1);

    return true;
  }


  // ---------------------------- //
  // - ENABLE MULTI-FACTOR AUTH - //
  // ---------------------------- //
  @Mutation(() => EnableMFAResponse)
  @UseMiddleware(isAuthenticated)
  async enableMFA(
    @Arg("userId", () => Int) userId: number,
  ): Promise<EnableMFAResponse | boolean> {
    
    try {
      const user = await User.findOne({ where: { userId }});
      if (!user) throw new Error("Could not find user");

      const tempMFASecret = speakeasy.generateSecret({ name: APP_NAME });
      // -> OTPLIB ALT IMPLEMENTATION PORTION
      // const temp2FASecret = authenticator.generateSecret(NUM_BYTES_TOTP_SECRET);
      const OTPAuthURL = generateOTPAuthURL(APP_NAME, tempMFASecret.base32);

      qrcode.toDataURL(OTPAuthURL, async (err: any, imageURL: string) => {
        if (err) {
          console.error(err);
          return;
        }

        const QRCodeURL = imageURL;
        await User.update(userId, { tempMFASecret: tempMFASecret.base32 });

        return { secret: tempMFASecret.base32, QRCodeURL };
      });
    } catch(err) {
      console.error(err);
      throw new Error("Problem encountered while generating distributing MFA secret");
    }
    // - TODO: -> Monitor this for problems, not sure about control flow since I need to do return
    //            stuff in the QR Code generation callback, since the codegen is asynchronous.
    return false;
  }


  // ----------------------------- //
  // - VERIFY MFA FOR FIRST TIME - //
  // ----------------------------- //
  @Mutation(() => Boolean)
  @UseMiddleware(isAuthenticated)
  async verifyMFA(
    @Arg("userId", () => Int) userId: number,
    @Arg("token", () => String) token: string
  ): Promise<Boolean> {

    try {
      const user = await User.findOne({ where: { userId }})
      if (!user) throw new Error("Could now find user");

      const { tempMFASecret } = user;

      // -> This endpoint should never get called before a secret has been disbursed to the user,
      //    but it's just here in case and to make the Typescript parser happy.
      if (!tempMFASecret) throw new Error("User has no temp MFA secret");

      // -> OTPLIB ALT IMPLEMENTATION PORTION
      // const verified = authenticator.check(token, tempMFASecret);

      const verified = speakeasy.totp.verify({
        secret: tempMFASecret, encoding: "base32", token,  window: 1
      });

      if (verified) {
        await User.update(userId, { MFASecret: tempMFASecret, tempMFASecret: undefined });
        return true;
      } else return false;
    } catch (err) {
      console.error(err);
      throw new Error(err);
    }
  }

  // ------------------------------------ //
  // - VALIDATE MFA FOR ALL OTHER TIMES - //
  // ------------------------------------ //
  @Mutation(() => Boolean)
  @UseMiddleware(isAuthenticated)
  async validateMFA(
    @Arg("userId", () => Int) userId: number,
    @Arg("token", () => String) token: string
  ): Promise<Boolean> {
    try {
      const user = await User.findOne({ where: { userId }})
      if (!user) throw new Error("Could now find user");

      const { MFASecret } = user;

      // -> This endpoint should never get called before a secret has been disbursed to the user,
      //    but it's just here in case and to make the Typescript parser happy.
      if (!MFASecret) throw new Error("User has no temp MFA secret");

      // -> OTPLIB ALT IMPLEMENTATION PORTION
      // const validated = authenticator.check(token, MFASecret);

      const validated = speakeasy.totp.verify({
        secret: MFASecret, encoding: "base32", token, window: 1
      });

      if (validated) return true;
      else return false;
    } catch (err) {
      console.error(err);
      throw new Error(err);
    }
  }
}
