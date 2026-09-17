import type { ButtonHTMLAttributes, CSSProperties, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { colors, fonts } from '../styles/tokens';

export function Card({
  children,
  accent,
  style,
  padding = '18px 20px',
}: {
  children: ReactNode;
  accent?: string;
  style?: CSSProperties;
  padding?: string | number;
}) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 6,
        border: `1px solid ${colors.border}`,
        borderTop: accent ? `3px solid ${accent}` : undefined,
        boxShadow: colors.cardShadow,
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';

const variantStyle: Record<BtnVariant, CSSProperties> = {
  primary: { background: colors.yellow, color: colors.blue, border: 'none', fontWeight: 700 },
  secondary: { background: '#fff', color: colors.blue, border: `1.5px solid ${colors.border}`, fontWeight: 600 },
  ghost: { background: 'transparent', color: colors.textSoft, border: 'none', fontWeight: 500, padding: 0 },
  danger: { background: '#fff', color: colors.textSoft, border: `1px solid ${colors.border}`, fontWeight: 600 },
  link: { background: 'none', border: 'none', color: colors.textSoft, fontWeight: 500, padding: 0 },
};

export function Btn({
  variant = 'secondary',
  style,
  children,
  ...rest
}: { variant?: BtnVariant } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      style={{
        height: variant === 'ghost' || variant === 'link' ? 'auto' : 38,
        padding: variant === 'ghost' || variant === 'link' ? 0 : '0 18px',
        borderRadius: 3,
        fontSize: 13,
        cursor: rest.disabled ? 'default' : 'pointer',
        opacity: rest.disabled ? 0.5 : 1,
        whiteSpace: 'nowrap',
        ...variantStyle[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Chip({
  label,
  active,
  onClick,
}: {
  label: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        height: 28,
        padding: '0 12px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        flexShrink: 0,
        border: `1.5px solid ${active ? colors.blue : colors.border}`,
        background: active ? colors.blue : '#fff',
        color: active ? '#fff' : colors.textSoft,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

export function Tab({ label, active, onClick }: { label: ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        height: 30,
        padding: '0 14px',
        border: 'none',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        background: active ? colors.blue : '#fff',
        color: active ? '#fff' : colors.textSoft,
      }}
    >
      {label}
    </button>
  );
}

export function TabGroup({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', border: `1.5px solid ${colors.border}`, borderRadius: 4, overflow: 'hidden', background: '#fff' }}>
      {children}
    </div>
  );
}

export function StatusPill({ bg, fg, label }: { bg: string; fg: string; label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 22,
        padding: '0 10px',
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        background: bg,
        color: fg,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: fg }} />
      {label}
    </span>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent,
  onClick,
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  accent: string;
  onClick?: () => void;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      style={{
        textAlign: 'left',
        background: '#fff',
        borderRadius: 6,
        border: `1px solid ${colors.border}`,
        borderTop: `3px solid ${accent}`,
        boxShadow: colors.cardShadow,
        padding: '14px 16px',
        cursor: onClick ? 'pointer' : 'default',
        display: 'block',
        width: '100%',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.textMuted, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontFamily: fonts.display, fontSize: 28, fontWeight: 800, color: colors.blue, lineHeight: 1 }}>{value}</div>
      {sub != null && <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 5 }}>{sub}</div>}
    </Tag>
  );
}

export function Field({ label, hint, children }: { label: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: colors.textBody }}>
        {label} {hint && <span style={{ color: colors.textMuted, fontWeight: 400 }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}

const fieldBase: CSSProperties = {
  height: 38,
  border: `1.5px solid ${colors.borderStrong}`,
  borderRadius: 3,
  padding: '0 12px',
  fontSize: 13,
  outline: 'none',
  background: '#fff',
  width: '100%',
};

export function TextInput({ style, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} style={{ ...fieldBase, ...style }} />;
}

export function Select({ style, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...rest} style={{ ...fieldBase, padding: '0 10px', ...style }}>
      {children}
    </select>
  );
}

export function TextArea({ style, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...rest}
      style={{
        border: `1.5px solid ${colors.borderStrong}`,
        borderRadius: 3,
        padding: '8px 12px',
        fontSize: 13,
        resize: 'vertical',
        outline: 'none',
        width: '100%',
        fontFamily: fonts.body,
        ...style,
      }}
    />
  );
}

export function EmptyState({ title, body, action }: { title: ReactNode; body?: ReactNode; action?: ReactNode }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 6,
        border: `1.5px dashed ${colors.borderStrong}`,
        padding: '56px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        textAlign: 'center',
      }}
    >
      <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 18 }}>{title}</div>
      {body && <div style={{ fontSize: 13, color: colors.textSoft, maxWidth: 480, lineHeight: 1.65 }}>{body}</div>}
      {action}
    </div>
  );
}

export function Mono({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <span style={{ fontFamily: fonts.mono, ...style }}>{children}</span>;
}
