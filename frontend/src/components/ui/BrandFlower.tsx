type Props = {
  className?: string;
};

export default function BrandFlower({ className = "" }: Props) {
  return (
    <span className={`brand-flower ${className}`} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}
