const NICKNAME_ADJECTIVES = [
  '꼼꼼한',
  '차분한',
  '날카로운',
  '성실한',
  '빠른',
  '든든한',
  '집중한',
  '영리한',
] as const;

const NICKNAME_NOUNS = [
  '기출러',
  '합격러',
  '문제왕',
  '풀이왕',
  '정답러',
  '복습러',
  '암기왕',
  '학습러',
] as const;

function pickRandom<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export function generateRandomNickname() {
  const adjective = pickRandom(NICKNAME_ADJECTIVES);
  const noun = pickRandom(NICKNAME_NOUNS);
  const suffix = Math.floor(Math.random() * 90) + 10;

  return `${adjective}${noun}${suffix}`;
}
