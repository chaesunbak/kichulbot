export function findNextQuestionNumber(
  questions: Array<{ number: number }>,
  questionCount: number,
) {
  const numbers = new Set(questions.map((question) => question.number));
  for (let number = 1; number <= questionCount; number += 1) {
    if (!numbers.has(number)) {
      return number;
    }
  }
  return null;
}
