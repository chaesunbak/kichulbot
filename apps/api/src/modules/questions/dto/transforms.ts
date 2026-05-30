import { TransformFnParams } from 'class-transformer';

/**
 * multipart/form-data 의 태그 필드를 string[] 로 정규화한다.
 * - 반복 필드(`tagIds=a&tagIds=b`) -> ['a', 'b']
 * - 쉼표 구분 문자열(`tagIds=a,b`) -> ['a', 'b']
 */
export function toStringArray({
  value,
}: TransformFnParams): string[] | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const raw = Array.isArray(value) ? value : [value];

  return raw
    .flatMap((item) => String(item).split(','))
    .map((item) => item.trim())
    .filter(Boolean);
}
