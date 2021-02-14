import { sign } from "jsonwebtoken";
import { ACCESS_JWT_LIFETIME } from "../constants";
import { User } from "../entities/User";

const { ACCESS_TOKEN_SECRET } = process.env;

export const createAccessToken = (user: User) => {
  return sign(
    { userId: user.id, email: user.email },
    `${ACCESS_TOKEN_SECRET}`,
    { expiresIn: ACCESS_JWT_LIFETIME }
  );
}
