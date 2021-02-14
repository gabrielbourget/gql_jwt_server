import { ITOTPSecret } from "./TOTPSecret";

export interface IUserMetadata {
  temp2FASecret?: ITOTPSecret;
  MFASecret?: ITOTPSecret;
}
