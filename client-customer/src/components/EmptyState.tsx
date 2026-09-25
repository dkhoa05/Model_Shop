import { PackageSearch } from "lucide-react";
import Button from "./Button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export default function EmptyState({ title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-950/70 p-8 text-center">
      <PackageSearch className="mb-4 text-zinc-600" size={44} />
      <h2 className="font-space-grotesk text-xl font-black uppercase text-white">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">{description}</p>
      {actionLabel && actionHref && (
        <Button href={actionHref} className="mt-6">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
