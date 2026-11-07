export function getPasswordError(password: string): string | null {
  if (password.length < 12) {
    return "Password must be at least 12 characters long.";
  }
  if (password.length > 128) {
    return "Password must be no longer than 128 characters.";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain a lowercase letter.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain an uppercase letter.";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain a number.";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must contain a special character.";
  }
  return null;
}
