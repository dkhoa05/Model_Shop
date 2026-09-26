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
    <div className="surface-soft flex min-h-72 flex-col items-center justify-center border-dashed p-8 text-center">
      <span className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-zinc-800 text-accent-text">
        <PackageSearch size={30} aria-hidden />
      </span>
      <h2 className="text-xl font-extrabold text-fg">{title}</h2>
      <p className="mt-2 max-w-md text-base leading-7 text-zinc-400">{description}</p>
      {actionLabel && actionHref && (
        <Button href={actionHref} className="mt-6">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
