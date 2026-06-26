import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default function DocumentsPage() {
  return (
    <div>
      <PageHeader title="Documents" description="View all uploaded documents" />
      <EmptyState
        title="Coming Soon"
        description="Document management will be available soon"
      />
    </div>
  );
}
