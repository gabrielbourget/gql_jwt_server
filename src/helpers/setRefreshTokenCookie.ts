import { Response } from "express"
import { REFRESH_TOKEN_COOKIE_KEY } from "../constants";

export const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie(`${REFRESH_TOKEN_COOKIE_KEY}`, token, { httpOnly: true });
}
