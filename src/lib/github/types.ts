export interface GitHubOwner {
  login: string;
  avatar_url: string;
  html_url: string;
  type: "User" | "Organization" | "Bot";
}

export interface GitHubLicense {
  key: string;
  name: string;
  spdx_id: string | null;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: GitHubOwner;
  html_url: string;
  description: string | null;
  homepage: string | null;
  language: string | null;
  topics?: string[];
  license: GitHubLicense | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  subscribers_count?: number;
  open_issues_count: number;
  default_branch: string;
  fork: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  type: "User" | "Organization" | "Bot";
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

export interface GitHubContributor {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

/** Language name → bytes of code, as returned by `/repos/{owner}/{repo}/languages`. */
export type GitHubLanguages = Record<string, number>;
