import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class AuthMailerService {
  private readonly resend: Resend;

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(
      this.configService.getOrThrow<string>('auth.resend.apiKey'),
    );
  }

  async sendEmailVerificationCode(email: string, code: string) {
    await this.resend.emails.send({
      from: this.configService.getOrThrow<string>('auth.resend.fromEmail'),
      to: email,
      subject: '기출봇 이메일 인증번호',
      text: `기출봇 이메일 인증번호는 ${code}입니다. 10분 안에 입력해주세요.`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6;">
          <h1 style="font-size: 20px;">기출봇 이메일 인증번호</h1>
          <p>아래 인증번호를 10분 안에 입력해주세요.</p>
          <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">${code}</p>
        </div>
      `,
    });
  }

  async sendPasswordResetLink(email: string, url: string) {
    await this.resend.emails.send({
      from: this.configService.getOrThrow<string>('auth.resend.fromEmail'),
      to: email,
      subject: '기출봇 비밀번호 재설정',
      text: `아래 링크에서 기출봇 비밀번호를 재설정해주세요. 링크는 30분 동안 유효합니다.\n${url}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6;">
          <h1 style="font-size: 20px;">기출봇 비밀번호 재설정</h1>
          <p>아래 버튼을 눌러 30분 안에 비밀번호를 재설정해주세요.</p>
          <p>
            <a href="${url}" style="display: inline-block; padding: 10px 16px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 8px;">
              비밀번호 재설정
            </a>
          </p>
          <p style="font-size: 12px; color: #71717a;">버튼이 열리지 않으면 아래 주소를 브라우저에 붙여넣어주세요.</p>
          <p style="font-size: 12px; color: #71717a;">${url}</p>
        </div>
      `,
    });
  }
}
