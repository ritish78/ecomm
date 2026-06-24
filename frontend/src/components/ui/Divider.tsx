"use client";

interface DividerProps {
  label?: string;
}

export default function Divider({ label = "or" }: DividerProps) {
  return (
    <div className="my-5 flex items-center gap-2">
      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      <span className="text-xs text-slate-400">{label}</span>
      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
    </div>
  );
}