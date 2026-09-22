export default function StatusBadge({ status, retryCount = 0 }: { status: string, retryCount?: number }) {
  let styles = "bg-surfaceHover text-muted border-border";
  let label = status;

  if (status === "PUBLISHED") {
    styles = "bg-success/10 text-success border-success/20";
    label = "Delivered";
  } else if (status === "PENDING" && retryCount > 0) {
    styles = "bg-warning/10 text-warning border-warning/20";
    label = `Retrying (${retryCount})`;
  } else if (status === "PENDING") {
    styles = "bg-primary/10 text-primary border-primary/20";
    label = "Pending";
  } else if (status === "PROCESSING") {
    styles = "bg-purple-500/10 text-purple-400 border-purple-500/20";
    label = "Processing";
  } else if (status === "DEAD") {
    styles = "bg-danger/10 text-danger border-danger/20";
    label = "DLQ";
  }

  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] uppercase tracking-wider font-semibold border ${styles}`}>
      {label}
    </span>
  );
}