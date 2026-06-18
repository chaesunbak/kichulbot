'use client';

import {
  Card,
  CardAction,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
import { Label } from '@kichulbot/ui/components/ui/label';
import {
  RadioGroup,
  RadioGroupItem,
} from '@kichulbot/ui/components/ui/radio-group';
import { type LucideIcon, Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

type ThemeValue = 'system' | 'light' | 'dark';

interface ThemeOption {
  value: ThemeValue;
  label: string;
  icon: LucideIcon;
}

const themeOptions: ThemeOption[] = [
  { value: 'system', label: '시스템', icon: Monitor },
  { value: 'light', label: '라이트', icon: Sun },
  { value: 'dark', label: '다크', icon: Moon },
];

export function ThemeSettingsCard() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setMounted(true), 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const selectedTheme = mounted ? (theme ?? 'system') : 'system';

  return (
    <Card className="mx-auto w-full">
      <CardHeader className="grid-cols-[1fr_auto] gap-4">
        <CardTitle>화면 모드</CardTitle>
        <CardAction>
          <RadioGroup
            value={selectedTheme}
            onValueChange={setTheme}
            className="w-fit gap-3 sm:w-52"
            aria-label="화면 모드"
          >
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <Label
                key={value}
                htmlFor={`theme-${value}`}
                className="w-full justify-start gap-2.5 text-sm font-normal"
              >
                <RadioGroupItem id={`theme-${value}`} value={value} />
                <Icon className="size-4 text-muted-foreground" />
                <span className="min-w-12">{label}</span>
              </Label>
            ))}
          </RadioGroup>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
