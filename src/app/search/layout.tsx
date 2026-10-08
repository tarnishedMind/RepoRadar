/**
 * The search segment renders two parallel slots: the page (`children`) and
 * `@modal`. Clicking a result soft-navigates to /owner/repo, which the
 * `@modal/(..)[owner]/[repo]` route intercepts and shows on top of the results.
 * A hard load or refresh of /owner/repo skips interception and renders the full
 * repo page instead.
 */
export default function SearchLayout({ children, modal }: LayoutProps<"/search">) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
