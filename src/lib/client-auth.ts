/**
 * Client-safe password validation - no server-only dependencies
 */
export function passwordIssues(pw: string): string[] {
  const issues: string[] = [];
  if (pw.length < 8) issues.push('At least 8 characters');
  if (!/[A-Za-z]/.test(pw)) issues.push('At least one letter');
  if (!/\d/.test(pw)) issues.push('At least one number');
  return issues;
}