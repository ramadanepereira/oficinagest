import { Wrench } from 'lucide-react';

// Logótipo: engrenagem verde + chave de bocas (como nos mockups).
export function Logo({ tamanho = 44, corChave = '#0b1220' }: { tamanho?: number; corChave?: string }) {
  return (
    <span className="relative inline-flex shrink-0" style={{ width: tamanho, height: tamanho }}>
      <svg viewBox="0 0 64 64" width={tamanho} height={tamanho} aria-hidden="true">
        <g fill="#1f9d5a">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <rect key={a} x="28.5" y="2" width="7" height="12" rx="2.5" transform={`rotate(${a} 32 32)`} />
          ))}
          <circle cx="32" cy="32" r="18" />
        </g>
        <circle cx="32" cy="32" r="10" fill="#0e2a1c" opacity="0.25" />
      </svg>
      <Wrench
        size={tamanho * 0.52}
        color={corChave}
        strokeWidth={2.6}
        style={{ position: 'absolute', inset: 0, margin: 'auto', transform: 'rotate(-45deg)' }}
      />
    </span>
  );
}