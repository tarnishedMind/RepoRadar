import { Suspense } from "react";
import { RepoPreview, RepoPreviewSkeleton } from "@/features/search";
import { Modal } from "@/shared/ui/modal";

// `(..)` intercepts the root-level /[owner]/[repo] route one segment above
// /search, but only for client-side navigations that start inside /search.
export default function RepoPreviewModal({
  params,
}: PageProps<"/[owner]/[repo]">) {
  return (
    <Modal>
      <Suspense fallback={<RepoPreviewSkeleton />}>
        {params.then(({ owner, repo }) => (
          <RepoPreview owner={owner} repo={repo} />
        ))}
      </Suspense>
    </Modal>
  );
}
