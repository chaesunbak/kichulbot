export const MINIMUM_LOADING_DURATION_MS = 400;

export async function withMinimumLoadingDuration<T>(
  task: Promise<T>,
  durationMs = MINIMUM_LOADING_DURATION_MS,
): Promise<T> {
  const loadingDuration = delay(durationMs);

  try {
    const result = await task;
    await loadingDuration;
    return result;
  } catch (error) {
    await loadingDuration;
    throw error;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
