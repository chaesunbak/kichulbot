import type { PropsWithChildren } from 'react';
import { Text, type TextProps } from 'react-native';

type TextVariant = 'body' | 'button' | 'eyebrow' | 'label' | 'mono' | 'title';

interface AppTextProps extends TextProps {
  variant?: TextVariant;
}

const textVariants = {
  body: 'text-base leading-6 text-slate-600',
  button: 'text-base font-bold text-white',
  eyebrow: 'text-xs font-bold text-blue-600',
  label: 'text-[13px] font-bold text-slate-700',
  mono: 'font-mono text-[13px] leading-5 text-slate-900',
  title: 'text-[28px] font-extrabold leading-9 text-slate-900',
} as const satisfies Record<TextVariant, string>;

export function AppText({
  children,
  className,
  variant = 'body',
  ...props
}: PropsWithChildren<AppTextProps>) {
  const variantClassName = textVariants[variant];
  const textClassName = className
    ? `${variantClassName} ${className}`
    : variantClassName;

  return (
    <Text {...props} className={textClassName}>
      {children}
    </Text>
  );
}
