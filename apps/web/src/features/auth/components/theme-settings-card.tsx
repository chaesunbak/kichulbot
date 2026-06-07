'use client';

import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
import { type LucideIcon, Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { cn } from '@/shared/lib/utils';

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
      <CardHeader>
        <CardTitle>화면 모드</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="
            grid gap-2
            sm:grid-cols-3
          "
        >
          {themeOptions.map(({ value, label, icon: Icon }) => {
            const isSelected = selectedTheme === value;

            return (
              <Button
                key={value}
                type="button"
                variant="outline"
                aria-pressed={isSelected}
                className={cn(
                  `
                    h-auto justify-start gap-3 rounded-lg border px-4 py-3
                    text-left
                  `,
                  isSelected &&
                    'border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                )}
                onClick={() => setTheme(value)}
              >
                <Icon className="size-4" />
                <span>{label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
