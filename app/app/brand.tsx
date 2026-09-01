import Image from 'next/image';

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? 'compact' : ''}`}>
      <Image className="brand-logo" src="/sentrio-logo.svg" alt="" width={40} height={40} priority />
      <div><strong>Sentrio</strong>{!compact && <span>Shift diary</span>}</div>
    </div>
  );
}
