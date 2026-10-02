import { GreenFutureLetterView } from "@/components/admin/partners/GreenFutureLetterView";
import {
  GREEN_FUTURE_VARIETY_DOCS_RAW,
  GREEN_FUTURE_VARIETY_DOCS_SUBJECT,
} from "@/lib/green-future-variety-docs-letter";

export const metadata = {
  title: "Variety identity docs (EN) · Green Future · Admin",
  description: GREEN_FUTURE_VARIETY_DOCS_SUBJECT,
};

export default function GreenFutureVarietyDocsEnPage() {
  return (
    <GreenFutureLetterView
      title="Request — variety identity documents (English)"
      description="Grower GACP file — GF self-certifies under clause 8. Not a PO. Distinct from DOA Seed Analysis Certificate."
      raw={GREEN_FUTURE_VARIETY_DOCS_RAW}
      lang="en"
    />
  );
}
