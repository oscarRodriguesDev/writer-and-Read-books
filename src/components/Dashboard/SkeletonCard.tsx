"use client";

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-line bg-surface p-5 shadow-sm animate-pulse">
      <div className="aspect-[3/4] w-full rounded-md bg-chipbg mb-4" />
      <div className="h-6 w-3/4 rounded bg-chipbg mb-2" />
      <div className="h-4 w-1/2 rounded bg-chipbg mb-3" />
      <div className="h-4 w-1/4 rounded bg-chipbg mb-4" />
      <div className="flex items-center justify-between">
        <div className="h-5 w-20 rounded-full bg-chipbg" />
        <div className="h-4 w-24 rounded bg-chipbg" />
      </div>
    </div>
  );
}