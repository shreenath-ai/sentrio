
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? 'compact' : ''}`}>
      {/* Native image keeps the local logo available offline without an image service. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="brand-logo" src="/sentrio-brand.svg" width={44} height={44} alt="" aria-hidden="true" />
      <div><strong>Sentrio</strong>{!compact && <span>Shift diary</span>}</div>
    </div>
  );
}
