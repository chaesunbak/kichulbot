import { Checkbox } from '@kichulbot/ui/components/ui/checkbox';

interface ToggleRowProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function ToggleRow({ label, checked, onCheckedChange }: ToggleRowProps) {
  return (
    <label
      className="
        flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2
        text-sm
      "
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      {label}
    </label>
  );
}
