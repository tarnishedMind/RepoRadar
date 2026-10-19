/** GitHub's own limits: owner ≤ 39 characters, repository name ≤ 100. */
const FULL_NAME = /^[\w.-]{1,39}\/[\w.-]{1,100}$/;

/** Checks an untrusted value is an "owner/repo" full name. */
export function isRepoFullName(value: unknown): value is string {
  return typeof value === "string" && FULL_NAME.test(value);
}

/** GitHub treats owner and repository names case-insensitively. */
export function sameRepo(a: string, b: string) {
  return a.toLowerCase() === b.toLowerCase();
}
