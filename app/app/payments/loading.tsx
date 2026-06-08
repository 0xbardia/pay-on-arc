import { CardSkeleton, TableSkeleton } from "@/components/premium/state-card";

export default function PaymentsLoading() {
  return (
    <div className="space-y-6">
      <CardSkeleton />
      <TableSkeleton rows={4} />
    </div>
  );
}
