import { Response } from "express"
import { REFRESH_TOKEN_COOKIE_KEY, REFRESH_TOKEN_ROUTE } from "../constants";

export const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie(`${REFRESH_TOKEN_COOKIE_KEY}`, token, { httpOnly: true, path: REFRESH_TOKEN_ROUTE });
}
