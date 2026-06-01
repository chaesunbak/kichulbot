interface PaperSession {
  year: number;
  month: number | null;
  grade: number | null;
  round: number | null;
}

export function formatPaperSession(paper: PaperSession) {
  if (paper.round) return `제${paper.round}회`;

  const year = paper.month
    ? `${paper.year}년 ${paper.month}월`
    : `${paper.year}학년도`;
  return paper.grade ? `${year} 고${paper.grade}` : year;
}
