import Logo from "./Logo";

/** Logo + wordmark, shared by every page header. Wrap it in a <Link> to make it clickable. */
export default function Brand() {
  return (
    <span className="flex items-center gap-2.5">
      <Logo size={34} />
      <span className="font-display text-2xl leading-none text-ink">Coroscope</span>
    </span>
  );
}
