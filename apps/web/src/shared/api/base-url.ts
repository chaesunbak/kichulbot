const DEFAULT_INTERNAL_API_BASE_URL = 'http://localhost:4000/api';

export function getInternalApiBaseUrl() {
  return (
    process.env.API_INTERNAL_BASE_URL?.trim() || DEFAULT_INTERNAL_API_BASE_URL
  );
}
