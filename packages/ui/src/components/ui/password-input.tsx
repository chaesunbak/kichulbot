'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { cn } from '../../lib/utils';
import { Button } from './button';
import { Input } from './input';

function PasswordInput({
  className,
  type: _type,
  disabled,
  value,
  defaultValue,
  onChange,
  ...props
}: React.ComponentProps<'input'>) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [hasUncontrolledValue, setHasUncontrolledValue] = React.useState(() =>
    hasInputValue(defaultValue),
  );
  const Icon = isVisible ? EyeOff : Eye;
  const hasValue =
    value === undefined ? hasUncontrolledValue : hasInputValue(value);

  React.useEffect(() => {
    if (!hasValue) {
      setIsVisible(false);
    }
  }, [hasValue]);

  return (
    <div data-slot="password-input" className="relative w-full">
      <Input
        type={isVisible ? 'text' : 'password'}
        className={cn('pr-10', className)}
        disabled={disabled}
        value={value}
        defaultValue={defaultValue}
        onChange={(event) => {
          if (value === undefined) {
            setHasUncontrolledValue(hasInputValue(event.target.value));
          }

          onChange?.(event);
        }}
        {...props}
      />
      {hasValue && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={isVisible ? '비밀번호 숨기기' : '비밀번호 보기'}
          aria-pressed={isVisible}
          disabled={disabled}
          className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground hover:text-foreground active:not-aria-[haspopup]:translate-y-[-50%]"
          onClick={() => setIsVisible((value) => !value)}
        >
          <Icon className="size-4" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}

function hasInputValue(
  value:
    | React.ComponentProps<'input'>['value']
    | React.ComponentProps<'input'>['defaultValue'],
) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value !== undefined && value !== null && String(value).length > 0;
}

export { PasswordInput };
