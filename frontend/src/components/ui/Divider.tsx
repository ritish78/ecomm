interface DividerProps {
  label?: string;
}

export default function Divider({ label = "or" }: DividerProps) {
  return (
    <div className="my-6 flex items-center gap-4">
      <span className="h-px flex-1 bg-[#dcc8cc]" aria-hidden="true" />
      <span className="text-xs text-[#795b65]">{label}</span>
      <span className="h-px flex-1 bg-[#dcc8cc]" aria-hidden="true" />
    </div>
  );
}
