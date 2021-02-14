import { MiddlewareFn } from "type-graphql";
import { verify } from "jsonwebtoken";
import { Context } from "src/Types";

const { ACCESS_TOKEN_SECRET } = process.env;

export const isAuthenticated: MiddlewareFn<Context> = ({ context }, next) => {
  const authenticationHeader = context.req.headers["authorization"];

  if (!authenticationHeader) throw new Error("Cannot complete unauthenticated request");

  try {
    const token = authenticationHeader.split(" ")[1];
    const payload = verify(token, ACCESS_TOKEN_SECRET!);
    context.payload = payload as any;
  } catch(err) {
    console.error("Problem authenticating request -> ", err);
    throw new Error("Problem authenticating request");
  }

  return next();
}