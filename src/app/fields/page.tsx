import type { Metadata } from "next";
import { FieldList } from "@/features/fields";

export const metadata: Metadata = {
  title: "Repos by field",
  description: "The most relevant active GitHub repositories for each developer field.",
};

export default function FieldsPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Pick your field</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          The most-starred active repositories across the GitHub topics that define each field.
        </p>
      </div>
      <FieldList />
    </main>
  );
}
