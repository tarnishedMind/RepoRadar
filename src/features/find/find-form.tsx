import Form from "next/form";
import { FIND_MAX_LENGTH } from "./intent";

/** next/form: a GET form, so every request has a shareable /find?q=… URL. */
export function FindForm({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <Form action="/find" className="flex flex-col gap-2 sm:flex-row">
      <input
        name="q"
        defaultValue={defaultValue}
        maxLength={FIND_MAX_LENGTH}
        required
        aria-label="Describe what you need"
        placeholder="I need a library that works with dates in JavaScript"
        className="flex-1 rounded-md border border-zinc-300 bg-transparent px-3 py-2 outline-none focus:border-zinc-500 dark:border-zinc-700"
      />
      <button className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900">
        Find
      </button>
    </Form>
  );
}
