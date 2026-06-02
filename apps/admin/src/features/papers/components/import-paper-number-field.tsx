import { Field, FieldLabel } from '@kichulbot/ui/components/field';
import { Input } from '@kichulbot/ui/components/input';

export function ImportPaperNumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange: (value: number | undefined) => void;
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <ImportPaperNumberInput
        ariaLabel={label}
        value={value}
        onChange={onChange}
      />
    </Field>
  );
}

export function ImportPaperNumberInput({
  ariaLabel,
  value,
  onChange,
}: {
  ariaLabel: string;
  value?: number;
  onChange: (value: number | undefined) => void;
}) {
  return (
    <Input
      aria-label={ariaLabel}
      type="number"
      inputMode="numeric"
      value={value ?? ''}
      onChange={(event) =>
        onChange(
          event.target.value === '' ? undefined : Number(event.target.value),
        )
      }
    />
  );
}
