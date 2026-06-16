import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

describe('auth server queries', () => {
  it('서버 전용 모듈로 선언되어 있다', async () => {
    const source = await readFile(
      new URL('./queries.ts', import.meta.url),
      'utf8',
    );

    expect(source.startsWith("import 'server-only';")).toBe(true);
  });
});
