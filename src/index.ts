// -> Beyond codebase
import "dotenv/config";
import "reflect-metadata";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";
import cookieParser from "cookie-parser";
import { verify } from "jsonwebtoken";
// import cors from "cors";
// -> Within Codebase
import { UserResolver } from "./UserResolver";
import { REFRESH_TOKEN_COOKIE_KEY, REFRESH_TOKEN_ROUTE, SERVER_PORT } from "./constants";
import { User } from "./entity/User";
import { createAccessToken, createRefreshToken, setRefreshTokenCookie } from "./helpers";

// const { REFRESH_TOKEN_SECRET } = process.env;
const { REFRESH_TOKEN_SECRET, CLIENT_URL } = process.env;

(async () => {
  const app = express();
  // - TODO: -> CORS Seems to be set up properly on FE and BE, still showing errors.
  // app.use(cors({
  //   origin: CLIENT_URL,
  //   // origin: "*",
  //   credentials: true,
  // }));
  app.use(cookieParser());
  app.get("/", (_, res) => res.send("boop"));

  app.post(REFRESH_TOKEN_ROUTE, async (req, res) => {
    const token = req.cookies[REFRESH_TOKEN_COOKIE_KEY];

    if (!token) return res.send({ ok: false, accessToken: null });
    
    let payload: any = null;
    try {
      payload = verify(token, REFRESH_TOKEN_SECRET!);
    } catch (err) {
      console.log(err);
      return res.send({ ok: false, accessToken: null });
    }

    const user: User | undefined = await User.findOne({ id: payload.userId });

    if (!user) return res.send({ ok: false, accessToken: null });

    if (user.tokenVersion !== payload.tokenVersion) {
      console.log("booooop");
      return res.send({ ok: false, accessToken: null });
    }

    setRefreshTokenCookie(res, createRefreshToken(user));

    // - DEV NOTE -> This should always exist since it's being pulled out of environment variables.
    //              -> Leaving this if statement to appease the Typescript parser
    if (CLIENT_URL) res.setHeader("Access-Control-Allow-Origin", CLIENT_URL);

    return res.send({ ok: true, accessToken: createAccessToken(user) });
  });

  await createConnection();

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver]
    }),
    context: ({ req, res }) => ({ req, res })
  });

  apolloServer.applyMiddleware({ app });
  // apolloServer.applyMiddleware({ app, cors: false });

  app.listen(SERVER_PORT, () => console.log(`Server is listening on port ${SERVER_PORT}`));
})();
