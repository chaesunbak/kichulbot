type NormalizeNextPathOptions = {
  fallback?: string;
  decode?: boolean;
};

export function normalizeNextPath(
  value: string | null | undefined,
  options: NormalizeNextPathOptions = {},
) {
  const fallback = options.fallback ?? '/';
  const nextPath = options.decode ? decodeNextPath(value) : value;

  if (!nextPath || !nextPath.startsWith('/') || nextPath.startsWith('//')) {
    return fallback;
  }

  return nextPath;
}

function decodeNextPath(value: string | null | undefined) {
  if (!value) return value;

  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}
