const NICKNAME_ADJECTIVES = [
  '귀여운',
  '상냥한',
  '씩씩한',
  '명랑한',
  '포근한',
  '활발한',
  '든든한',
  '영리한',
] as const;

const NICKNAME_ANIMALS = [
  '코끼리',
  '고양이',
  '강아지',
  '토끼',
  '다람쥐',
  '햄스터',
  '펭귄',
  '수달',
  '고래',
  '판다',
  '사슴',
  '여우',
] as const;

function pickRandom<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export function generateRandomNickname() {
  const adjective = pickRandom(NICKNAME_ADJECTIVES);
  const animal = pickRandom(NICKNAME_ANIMALS);
  const suffix = Math.floor(Math.random() * 90) + 10;

  return `${adjective}${animal}${suffix}`;
}
