export type ValidationResult =
  | { readonly valid: true; readonly value: string }
  | { readonly valid: false; readonly message: string };

const invalid = (message: string): ValidationResult => ({
  valid: false,
  message,
});

const NAME_MIN = 2;
const NAME_MAX = 60;

export function validateName(input: string): ValidationResult {
  const value = input.trim().replace(/\s+/g, " ");
  if (value.length === 0) return invalid("Enter your name.");
  if (value.length < NAME_MIN)
    return invalid("Your name needs at least 2 characters.");
  if (value.length > NAME_MAX)
    return invalid("Keep your name under 60 characters.");
  return { valid: true, value };
}

const EMAIL_PATTERN =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

const EMAIL_ERROR = "Enter a valid email address, like name@example.com.";

export function validateEmail(input: string): ValidationResult {
  const value = input.trim().toLowerCase();
  if (value.length === 0) return invalid("Enter your email address.");
  if (value.length > 254 || !EMAIL_PATTERN.test(value))
    return invalid(EMAIL_ERROR);

  const at = value.lastIndexOf("@");
  const local = value.slice(0, at);
  const tld = value.slice(value.lastIndexOf(".") + 1);

  const localIsValid =
    local.length <= 64 &&
    !local.startsWith(".") &&
    !local.endsWith(".") &&
    !local.includes("..");
  const tldIsValid = tld.length >= 2 && !/^\d+$/.test(tld);

  return localIsValid && tldIsValid
    ? { valid: true, value }
    : invalid(EMAIL_ERROR);
}
