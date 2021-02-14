import { sign } from "jsonwebtoken";
import { REFRESH_JWT_LIFETIME } from "../constants";
import { User } from "../entities/User";

const { REFRESH_TOKEN_SECRET } = process.env;

export const createRefreshToken = (user: User) => {
  return sign(
    { userId: user.id, tokenVersion: user.tokenVersion },
    `${REFRESH_TOKEN_SECRET}`,
    { expiresIn: REFRESH_JWT_LIFETIME }
  );
}
