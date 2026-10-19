import type { Metadata } from "next";
import { getUser } from "@/entities/github/server";
import { UserProfile } from "@/features/user/server";

type Props = PageProps<"/u/[login]">;

export function generateStaticParams() {
  return [{ login: "vercel" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { login } = await params;
  const user = await getUser(login);
  if (!user) return { title: "User not found" };

  const name = user.name ? `${user.name} (@${user.login})` : `@${user.login}`;
  return {
    title: name,
    description: user.bio ?? `${name} on GitHub, explored with RepoRadar.`,
    openGraph: { title: name },
  };
}

// Unlike the repo page, this page awaits params at the top level and lets the
// sibling `loading.tsx` act as the Suspense boundary for the whole segment.
export default async function UserPage({ params }: Props) {
  const { login } = await params;
  return <UserProfile login={login} />;
}
