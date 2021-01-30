import { sign } from "jsonwebtoken";
import { ACCESS_JWT_LIFETIME, REFRESH_JWT_LIFETIME } from "../constants";
import { User } from "../entity/User";

export const createAccessToken = (user: User) => {
  return sign(
    { userId: user.id, email: user.email },
    "sl;akdfnlw;iafne;ioanwasdjfasdfadf",
    { expiresIn: ACCESS_JWT_LIFETIME}
  );
}

export const createRefreshToken = (user: User) => {
  return sign(
    { userId: user.id },
    "asdjans;dobfaskjdfbas;kdfjb",
    { expiresIn: REFRESH_JWT_LIFETIME }
  );
}