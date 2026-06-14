import type { UpdatePaperMetadataValues } from '../types';

interface PaperMetadata {
  title: string;
  year: number;
  round: number | null;
}

interface PaperSession {
  year: number;
  month: number | null;
  grade: number | null;
  round: number | null;
}

export function toMetadataValues(
  paper: PaperMetadata,
): UpdatePaperMetadataValues {
  return {
    title: paper.title,
    year: paper.year,
    round: paper.round,
  };
}

export function formatPaperSession(paper: PaperSession) {
  if (paper.round) return `제${paper.round}회`;

  const year = paper.month
    ? `${paper.year}년 ${paper.month}월`
    : `${paper.year}학년도`;
  return paper.grade ? `${year} 고${paper.grade}` : year;
}
