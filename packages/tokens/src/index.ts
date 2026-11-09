/**
 * Design tokens On-Track, disalin dari halaman "01 · Foundations" di Figma
 * (file PspztivdJSlw5OU1O3ljAr). Hanya mode terang untuk saat ini.
 */

export const color = {
  bg: {
    surface: '#FFFFFF',
    canvas: '#F5F5F4',
    subtle: '#FAFAF9',
    hover: '#F5F5F4',
    disabled: '#E7E7E5',
    inverse: '#0A0A0A',
    inverseHover: '#1F1F1F',
    inverseOverlay: 'rgba(255, 255, 255, 0.08)',
    scrim: 'rgba(10, 10, 10, 0.45)',
  },
  text: {
    primary: '#0A0A0A',
    secondary: '#666666',
    accent: '#3F5F00',
    disabled: '#858583',
    inverse: '#FFFFFF',
    onAccent: '#0A0A0A',
  },
  accent: {
    default: '#C6F135',
    hover: '#B2DC22',
    subtle: '#F1FBD6',
  },
  border: {
    default: '#E7E7E5',
    strong: '#D4D4D2',
    control: '#858583',
    focus: '#0A0A0A',
  },
  status: {
    successFg: '#3F5F00',
    successBg: '#F1FBD6',
    warningFg: '#8A5A00',
    warningBg: '#FFF4DB',
    dangerFg: '#B42318',
    dangerBg: '#FEECEB',
    dangerHover: '#912018',
  },
} as const;

export const space = {
  2: 2,
  4: 4,
  8: 8,
  12: 12,
  16: 16,
  20: 20,
  24: 24,
  32: 32,
  40: 40,
  48: 48,
  64: 64,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  full: 999,
} as const;

export const size = {
  buttonL: 52,
  iconTarget: 44,
} as const;

export const shadow = {
  toast: '0 8px 12px rgba(0, 0, 0, 0.12)',
  dialog: '0 16px 24px rgba(0, 0, 0, 0.16)',
  drawer: '-8px 0 32px rgba(0, 0, 0, 0.16)',
  menu: '0 8px 24px rgba(0, 0, 0, 0.08)',
} as const;

export const fontFamily = 'Inter';

export type TypeStyle = {
  /** px */
  size: number;
  weight: 400 | 500 | 600 | 700;
  /** Pengali terhadap `size`. */
  lineHeight: number;
  /** Persen terhadap `size`, sama seperti nilai letter spacing di Figma. */
  tracking: number;
  uppercase?: boolean;
};

export const typography = {
  numericClock: { size: 48, weight: 600, lineHeight: 1.1, tracking: -3 },
  displayL: { size: 40, weight: 700, lineHeight: 1.1, tracking: -2 },
  numericKpi: { size: 32, weight: 600, lineHeight: 1.1, tracking: -2 },
  headingH1: { size: 28, weight: 700, lineHeight: 1.2, tracking: -1.5 },
  headingH2: { size: 20, weight: 600, lineHeight: 1.3, tracking: -1 },
  headingH3: { size: 16, weight: 600, lineHeight: 1.4, tracking: -0.5 },
  bodyM: { size: 16, weight: 400, lineHeight: 1.5, tracking: 0 },
  bodyS: { size: 14, weight: 400, lineHeight: 1.5, tracking: 0 },
  labelM: { size: 14, weight: 500, lineHeight: 1.4, tracking: 0 },
  labelS: { size: 12, weight: 500, lineHeight: 1.4, tracking: 2, uppercase: true },
  caption: { size: 12, weight: 400, lineHeight: 1.4, tracking: 0 },
} as const satisfies Record<string, TypeStyle>;

export type TypographyName = keyof typeof typography;

/** Letter spacing dalam px, untuk React Native. */
export function trackingPx(style: TypeStyle): number {
  return (style.size * style.tracking) / 100;
}

const kebab = (value: string) => value.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);

/**
 * Deklarasi CSS custom property untuk web, memakai nama yang sama dengan
 * variabel Figma (mis. `--color-bg-surface`, `--space-16`, `--radius-md`).
 */
export function cssVariables(): string {
  const lines: string[] = [];

  for (const [group, values] of Object.entries(color)) {
    for (const [name, value] of Object.entries(values)) {
      lines.push(`--color-${group}-${kebab(name)}: ${value};`);
    }
  }
  for (const [name, value] of Object.entries(space)) lines.push(`--space-${name}: ${value}px;`);
  for (const [name, value] of Object.entries(radius)) lines.push(`--radius-${name}: ${value}px;`);
  for (const [name, value] of Object.entries(size)) lines.push(`--size-${kebab(name)}: ${value}px;`);
  for (const [name, value] of Object.entries(shadow)) lines.push(`--shadow-${name}: ${value};`);

  for (const [name, style] of Object.entries<TypeStyle>(typography)) {
    const prefix = `--type-${kebab(name)}`;
    lines.push(`${prefix}-font: ${style.weight} ${style.size}px/${style.lineHeight} var(--font-sans);`);
    lines.push(`${prefix}-tracking: ${style.tracking / 100}em;`);
  }

  return `:root {\n${lines.map((line) => `  ${line}`).join('\n')}\n}`;
}
