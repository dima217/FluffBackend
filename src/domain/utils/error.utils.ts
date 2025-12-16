import { QueryFailedError } from 'typeorm';

export function isUniqueError(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes('unique constraint') ||
    message.includes('duplicate key') ||
    message.includes('duplicate entry') ||
    message.includes('unique_violation')
  );
}
