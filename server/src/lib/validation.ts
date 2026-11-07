export const NAME_MIN = 2;
export const NAME_MAX = 20;
const EMAIL_MAX = 254;

export function getNameError(name: string): string | null {
  if (name.length < NAME_MIN) {
    return `Name must be at least ${NAME_MIN} characters.`;
  }
  if (name.length > NAME_MAX) {
    return `Name can't be longer than ${NAME_MAX} characters.`;
  }
  if (!/^[\p{L}\p{N}]+$/u.test(name)) {
    return "Name can only contain letters and numbers.";
  }
  return null;
}

export function getEmailError(email: string): string | null {
  if (email.length > EMAIL_MAX || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Enter a valid email address.";
  }
  return null;
}
