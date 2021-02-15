import { sign } from "jsonwebtoken";
import { ACCESS_JWT_LIFETIME } from "../constants";
import { User } from "../entity/User";

const { ACCESS_TOKEN_SECRET } = process.env;

export const createAccessToken = (user: User) => {
  return sign(
    { userId: user.id, email: user.email, tokenVersion: user.tokenVersion },
    `${ACCESS_TOKEN_SECRET}`,
    { expiresIn: ACCESS_JWT_LIFETIME }
  );
}
