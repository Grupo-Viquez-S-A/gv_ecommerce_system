export function getDigitsOnly(value = "") {
  return String(value || "").replace(/\D/g, "");
}

export function formatLegalId(value = "") {
  const digits = getDigitsOnly(value).slice(0, 10);

  if (digits.length <= 1) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 1)}-${digits.slice(1)}`;
  }

  return `${digits.slice(0, 1)}-${digits.slice(1, 4)}-${digits.slice(4)}`;
}

export function formatPhoneNumber(value = "") {
  let digits = getDigitsOnly(value);

  if (digits.length > 8 && digits.startsWith("506")) {
    digits = digits.slice(3);
  }

  digits = digits.slice(0, 8);

  if (digits.length <= 4) {
    return digits;
  }

  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}
