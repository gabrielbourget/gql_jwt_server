export const generateOTPAuthURL = (name: string, secret: string): string => {
  return `otpauth://totp/${encodeURIComponent(name.trim())}?secret=${secret.trim()}`
}
