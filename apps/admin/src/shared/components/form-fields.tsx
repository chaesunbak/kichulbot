import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@kichulbot/ui/components/ui/field';
import { Input } from '@kichulbot/ui/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kichulbot/ui/components/ui/select';
import { Switch } from '@kichulbot/ui/components/ui/switch';
import type { ComponentProps, ReactNode } from 'react';
import {
  type Control,
  Controller,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';

type BaseFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = {
  control: Control<TFieldValues>;
  name: TName;
  label: ReactNode;
  description?: ReactNode;
  id?: string;
};

type TextFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = BaseFieldProps<TFieldValues, TName> &
  Omit<
    ComponentProps<typeof Input>,
    | 'aria-invalid'
    | 'defaultValue'
    | 'id'
    | 'name'
    | 'onBlur'
    | 'onChange'
    | 'ref'
    | 'value'
  >;

export function TextField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  id,
  ...inputProps
}: TextFieldProps<TFieldValues, TName>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const fieldId = id ?? field.name;

        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
            <Input
              {...inputProps}
              id={fieldId}
              name={field.name}
              value={(field.value ?? '') as string}
              onBlur={field.onBlur}
              onChange={field.onChange}
              ref={field.ref}
              aria-invalid={fieldState.invalid}
            />
            {description && <FieldDescription>{description}</FieldDescription>}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
}

type NumberFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = BaseFieldProps<TFieldValues, TName> &
  Omit<
    ComponentProps<typeof Input>,
    | 'aria-invalid'
    | 'defaultValue'
    | 'id'
    | 'name'
    | 'onBlur'
    | 'onChange'
    | 'ref'
    | 'type'
    | 'value'
  > & {
    emptyValue?: number | null | '';
  };

export function NumberField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  id,
  emptyValue = null,
  inputMode = 'numeric',
  ...inputProps
}: NumberFieldProps<TFieldValues, TName>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const fieldId = id ?? field.name;

        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
            <Input
              {...inputProps}
              id={fieldId}
              name={field.name}
              type="number"
              inputMode={inputMode}
              value={(field.value ?? '') as number | string}
              onBlur={field.onBlur}
              onChange={(event) =>
                field.onChange(
                  event.target.value === ''
                    ? emptyValue
                    : Number(event.target.value),
                )
              }
              ref={field.ref}
              aria-invalid={fieldState.invalid}
            />
            {description && <FieldDescription>{description}</FieldDescription>}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
}

type SelectItemOption = {
  value: string;
  label: ReactNode;
};

type SelectEmptyOption = SelectItemOption & {
  formValue?: null | '';
};

type SelectFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = BaseFieldProps<TFieldValues, TName> & {
  items: SelectItemOption[];
  placeholder?: string;
  emptyOption?: SelectEmptyOption;
  disabled?: boolean;
  triggerClassName?: string;
  onSelectedValueChange?: (value: string) => void;
};

export function SelectField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  id,
  items,
  placeholder,
  emptyOption,
  disabled,
  triggerClassName = 'w-full',
  onSelectedValueChange,
}: SelectFieldProps<TFieldValues, TName>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const fieldId = id ?? field.name;
        const value =
          field.value === null || field.value === undefined
            ? (emptyOption?.value ?? '')
            : String(field.value);

        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
            <Select
              name={field.name}
              value={value}
              disabled={disabled}
              onValueChange={(selectedValue) => {
                field.onChange(
                  selectedValue === emptyOption?.value
                    ? (emptyOption.formValue ?? null)
                    : selectedValue,
                );
                onSelectedValueChange?.(selectedValue);
              }}
            >
              <SelectTrigger
                id={fieldId}
                ref={field.ref}
                onBlur={field.onBlur}
                className={triggerClassName}
                aria-invalid={fieldState.invalid}
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {emptyOption && (
                  <SelectItem value={emptyOption.value}>
                    {emptyOption.label}
                  </SelectItem>
                )}
                {items.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {description && <FieldDescription>{description}</FieldDescription>}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
}

type SwitchFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = BaseFieldProps<TFieldValues, TName> & {
  disabled?: boolean;
  className?: string;
};

export function SwitchField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  id,
  disabled,
  className,
}: SwitchFieldProps<TFieldValues, TName>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const fieldId = id ?? field.name;

        return (
          <Field
            className={className}
            orientation="horizontal"
            data-invalid={fieldState.invalid}
          >
            <FieldContent>
              <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
              {description && (
                <FieldDescription>{description}</FieldDescription>
              )}
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </FieldContent>
            <Switch
              id={fieldId}
              name={field.name}
              checked={Boolean(field.value)}
              disabled={disabled}
              onBlur={field.onBlur}
              onCheckedChange={field.onChange}
              ref={field.ref}
              aria-invalid={fieldState.invalid}
            />
          </Field>
        );
      }}
    />
  );
}
