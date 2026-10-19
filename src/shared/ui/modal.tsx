"use client";

import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef } from "react";

/**
 * Route-driven modal built on the native <dialog>: focus trapping and the top
 * layer come for free. Closing just goes back in history, which un-intercepts
 * the route and restores the underlying page.
 *
 * With Cache Components, Next keeps visited routes mounted but hidden inside
 * React <Activity>. So the dialog is opened in a layout effect (re-runs each
 * time the route becomes visible again, e.g. on browser forward) and closed in
 * its cleanup (runs when the route is hidden, e.g. on browser back).
 */
export function Modal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={ref}
      // Escape: let the router close it via navigation instead of the browser.
      onCancel={(e) => {
        e.preventDefault();
        router.back();
      }}
      // A click on the dialog element itself (not its content) is the backdrop.
      onClick={(e) => e.target === ref.current && router.back()}
      className="m-auto w-[min(640px,calc(100vw-2rem))] rounded-xl border border-zinc-200 bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm dark:border-zinc-800"
    >
      <div className="relative p-6">
        <button
          onClick={() => router.back()}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-md px-2 text-xl leading-none text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ×
        </button>
        {children}
      </div>
    </dialog>
  );
}
