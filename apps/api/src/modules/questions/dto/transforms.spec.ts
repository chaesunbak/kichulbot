import { toStringArray } from './transforms';

describe('questions dto transforms', () => {
  it('비어 있는 태그 값은 undefined로 정규화한다', () => {
    expect(toStringArray({ value: undefined } as never)).toBeUndefined();
    expect(toStringArray({ value: null } as never)).toBeUndefined();
    expect(toStringArray({ value: '' } as never)).toBeUndefined();
  });

  it('쉼표로 구분된 문자열을 공백 없는 문자열 배열로 변환한다', () => {
    expect(toStringArray({ value: 'tag_1, tag_2,, tag_3 ' } as never)).toEqual([
      'tag_1',
      'tag_2',
      'tag_3',
    ]);
  });

  it('반복 필드 배열과 쉼표 구분 값을 함께 정규화한다', () => {
    expect(
      toStringArray({ value: ['tag_1, tag_2', ' tag_3 '] } as never),
    ).toEqual(['tag_1', 'tag_2', 'tag_3']);
  });
});
