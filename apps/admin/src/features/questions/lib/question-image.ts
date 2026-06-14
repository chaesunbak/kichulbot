export function getImageFileName(
  imageUrl: string,
  baseUrl = window.location.href,
) {
  try {
    const url = new URL(imageUrl, baseUrl);
    const fileName = url.pathname.split('/').filter(Boolean).at(-1);
    return fileName ? decodeURIComponent(fileName) : 'question-image.webp';
  } catch {
    return 'question-image.webp';
  }
}
