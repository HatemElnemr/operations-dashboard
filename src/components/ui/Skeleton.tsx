interface SkeletonProps {
  className?: string;
}

/** Reusable skeleton block — give it sizing classes via className. */
export function Skeleton({ className = "" }: SkeletonProps) {
  return <span aria-hidden className={`block animate-pulse rounded-md bg-slate-200 ${className}`} />;
}
