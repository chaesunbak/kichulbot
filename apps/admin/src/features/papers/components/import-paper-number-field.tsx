import { Field, FieldLabel } from '@kichulbot/ui/components/ui/field';
import { Input } from '@kichulbot/ui/components/ui/input';

export function ImportPaperNumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number | null;
  onChange: (value: number | null) => void;
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
  value?: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <Input
      aria-label={ariaLabel}
      type="number"
      inputMode="numeric"
      value={value ?? ''}
      onChange={(event) =>
        onChange(event.target.value === '' ? null : Number(event.target.value))
      }
    />
  );
}
