import { MiddlewareFn } from "type-graphql";
import { verify } from "jsonwebtoken";
import { Context } from "src/Types";

const { ACCESS_TOKEN_SECRET } = process.env;

export const isAuthorized: MiddlewareFn<Context> = ({ context }, next) => {
  const authorization = context.req.headers["authorization"];

  if (!authorization) throw new Error("Cannot complete unauthenticated request");

  try {
    const token = authorization.split(" ")[1];
    const payload = verify(token, ACCESS_TOKEN_SECRET!);
    context.payload = payload as any;
  } catch(err) {
    console.error("Problem authenticating request -> ", err);
    throw new Error("Problem authenticating request");
  }

  return next();
}