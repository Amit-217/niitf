type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;

const getString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const read = (value: unknown, key: string): unknown =>
  isRecord(value) ? value[key] : undefined;

const buildFieldMessage = (path: string | null, message: string | null): string | null => {
  if (!path && !message) return null;
  if (!message) return `${path} is invalid.`;
  if (!path) return message;
  if (message.includes(path)) return message;
  return `${path}: ${message}`;
};

const extractFieldMessages = (value: unknown): string[] => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        const message = getString(read(entry, "message")) ?? getString(entry);
        const path = getString(read(entry, "path")) ?? null;
        return buildFieldMessage(path, message);
      })
      .filter((entry): entry is string => Boolean(entry));
  }

  if (!isRecord(value)) return [];

  return Object.entries(value)
    .map(([key, entry]) => {
      const message = getString(read(entry, "message")) ?? getString(entry);
      const path = getString(read(entry, "path")) ?? key;
      return buildFieldMessage(path, message);
    })
    .filter((entry): entry is string => Boolean(entry));
};

export const getApiErrorMessage = (
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string => {
  if (!error) return fallback;
  if (typeof error === "string") return error;

  const responseData = read(read(error, "response"), "data");
  const source = responseData ?? error;
  const nestedError = read(source, "error");

  const fieldMessages = [
    ...extractFieldMessages(read(source, "fieldErrors")),
    ...extractFieldMessages(read(source, "errors")),
    ...extractFieldMessages(read(nestedError, "fieldErrors")),
    ...extractFieldMessages(read(nestedError, "errors")),
  ];

  if (fieldMessages.length > 0) return fieldMessages[0];

  const messageCandidates = [
    getString(read(source, "message")),
    getString(read(nestedError, "message")),
    getString(read(error, "message")),
  ];

  return messageCandidates.find((message): message is string => Boolean(message)) ?? fallback;
};
