import * as React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { PasswordInput } from './password-input';

afterEach(() => {
  cleanup();
});

describe('PasswordInput', () => {
  it('값이 없으면 보기 버튼을 렌더링하지 않는다', () => {
    render(<PasswordInput aria-label="비밀번호" />);

    expect(screen.getByLabelText('비밀번호')).toHaveProperty(
      'type',
      'password',
    );
    expect(screen.queryByRole('button', { name: '비밀번호 보기' })).toBeNull();
  });

  it('보기 버튼을 누르면 입력 타입을 전환한다', async () => {
    const user = userEvent.setup();

    render(<PasswordInput aria-label="비밀번호" defaultValue="secret" />);

    const input = screen.getByLabelText('비밀번호');
    const showButton = screen.getByRole('button', { name: '비밀번호 보기' });

    expect(input).toHaveProperty('type', 'password');

    await user.click(showButton);

    expect(input).toHaveProperty('type', 'text');
    expect(
      screen
        .getByRole('button', { name: '비밀번호 숨기기' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
  });
});
