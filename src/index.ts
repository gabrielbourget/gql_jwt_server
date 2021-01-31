// -> Beyond codebase
import "dotenv/config";
import "reflect-metadata";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";
import cookieParser from "cookie-parser";
import { verify } from "jsonwebtoken";
// -> Within Codebase
import { UserResolver } from "./UserResolver";
import { REFRESH_TOKEN_COOKIE_KEY, SERVER_PORT } from "./constants";
import { User } from "./entity/User";
import { createAccessToken, createRefreshToken, setRefreshTokenCookie } from "./helpers";

const { REFRESH_TOKEN_SECRET } = process.env;

(async () => {
  const app = express();
  app.use(cookieParser());
  app.get("/", (_, res) => res.send("boop"));

  app.post("/refresh_token", async (req, res) => {
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

    setRefreshTokenCookie(res, createRefreshToken(user));

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

  app.listen(SERVER_PORT, () => console.log(`Server is listening on port ${SERVER_PORT}`));
})();

// createConnection().then(async connection => {

//     console.log("Inserting a new user into the database...");
//     const user = new User();
//     user.firstName = "Timber";
//     user.lastName = "Creek";
//     user.age = 25;
//     await connection.manager.save(user);
//     console.log("Saved a new user with id: " + user.id);

//     console.log("Loading users from the database...");
//     const users = await connection.manager.find(User);
//     console.log("Loaded users: ", users);

//     console.log("Here you can setup and run express/koa/any other framework.");

// }).catch(error => console.log(error));
