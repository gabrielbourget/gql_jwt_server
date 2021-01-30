import { sign } from "jsonwebtoken";
import { ACCESS_JWT_LIFETIME, REFRESH_JWT_LIFETIME } from "../constants";
import { User } from "../entity/User";

const { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } = process.env;

export const createAccessToken = (user: User) => {
  return sign(
    { userId: user.id, email: user.email },
    `${ACCESS_TOKEN_SECRET}`,
    { expiresIn: ACCESS_JWT_LIFETIME }
  );
}

export const createRefreshToken = (user: User) => {
  return sign(
    { userId: user.id },
    `${REFRESH_TOKEN_SECRET}`,
    { expiresIn: REFRESH_JWT_LIFETIME }
  );
}