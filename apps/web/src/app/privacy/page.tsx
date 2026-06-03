import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '개인정보처리방침 | 기출봇',
  description: '기출봇 개인정보처리방침',
};

const processingRows = [
  {
    category: '게스트 이용',
    items: '사용자 식별값, 인증 유형, 시간대, 생성·수정 일시',
    purpose: '게스트 계정 생성, 사용자별 학습 기록 분리, 계정 전환',
    period: '회원 탈퇴 또는 계정 삭제 요청 시까지',
  },
  {
    category: '이메일 회원가입',
    items:
      '이메일 주소, 비밀번호 해시, 닉네임, 인증번호 발송·확인 이력, 인증 유형, 시간대, 생성·수정 일시',
    purpose: '이메일 인증, 회원 식별, 이메일 계정 생성 및 관리, 부정 이용 방지',
    period: '회원 탈퇴 또는 계정 삭제 요청 시까지',
  },
  {
    category: '소셜 로그인',
    items:
      '소셜 계정 식별값, 소셜 계정 이메일, 소셜 프로필 닉네임, 인증 유형, 시간대, 생성·수정 일시',
    purpose: '회원 식별, 소셜 로그인, 계정 관리, 부정 이용 방지',
    period: '회원 탈퇴 또는 계정 삭제 요청 시까지',
  },
  {
    category: '학습 서비스 이용',
    items:
      '문제지 보관 정보, 폴더 정보, 풀이 세션, 답안, 임시 답안, 정오답 여부, 풀이 시간, 생성·수정 일시',
    purpose: '풀이 기록 저장, 오답 관리, 약점 분석, 맞춤형 학습 자료 제공',
    period: '회원 탈퇴 또는 계정 삭제 요청 시까지',
  },
  {
    category: '서비스 이용 과정에서 자동 생성',
    items:
      '로그인 쿠키, 접속 일시, IP 주소, 사용자 에이전트, 서비스 이용 기록, 오류 기록',
    purpose: '로그인 상태 유지, 보안, 장애 대응, 서비스 품질 개선',
    period:
      '목적 달성 후 지체 없이 파기. 관계 법령상 보존이 필요한 경우 해당 기간까지 보관',
  },
] as const;

const sections = [
  {
    title: '제1조 개인정보의 처리 목적, 항목 및 보유기간',
    body: (
      <>
        <p>
          기출봇 운영자(이하 회사)는 서비스 제공에 필요한 최소한의 개인정보를
          다음과 같이 처리합니다.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-180 border-collapse text-left text-sm">
            <thead>
              <tr className="border-y bg-zinc-50 text-zinc-900">
                <th className="p-3 font-semibold">구분</th>
                <th className="p-3 font-semibold">처리 항목</th>
                <th className="p-3 font-semibold">처리 목적</th>
                <th className="p-3 font-semibold">보유기간</th>
              </tr>
            </thead>
            <tbody>
              {processingRows.map((row) => (
                <tr key={row.category} className="border-b">
                  <td className="p-3 align-top font-medium text-zinc-900">
                    {row.category}
                  </td>
                  <td className="p-3 align-top">{row.items}</td>
                  <td className="p-3 align-top">{row.purpose}</td>
                  <td className="p-3 align-top">{row.period}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    ),
  },
  {
    title: '제2조 만 14세 미만 아동의 개인정보 처리',
    body: (
      <p>
        회사는 원칙적으로 만 14세 미만 아동을 대상으로 서비스를 제공하지
        않습니다. 만 14세 미만 아동의 개인정보 처리가 필요해지는 경우 법정대리인
        동의 등 관련 법령상 필요한 절차를 준수합니다.
      </p>
    ),
  },
  {
    title: '제3조 개인정보의 제3자 제공',
    body: (
      <p>
        회사는 정보주체의 개인정보를 제1조의 목적 범위 안에서만 처리하며,
        정보주체의 동의, 법률의 특별한 규정 등 개인정보 보호법에서 허용하는
        경우를 제외하고 개인정보를 제3자에게 제공하지 않습니다.
      </p>
    ),
  },
  {
    title: '제4조 개인정보 처리업무의 위탁',
    body: (
      <p>
        회사는 안정적인 서비스 운영을 위해 서버, 데이터베이스, 보안, 장애 대응
        등 서비스 제공에 필요한 업무를 외부 사업자에게 위탁할 수 있습니다.
        위탁이 발생하는 경우 수탁자, 위탁 업무 내용 및 변경 사항을 이 방침 또는
        서비스 공지로 공개하고, 수탁자가 개인정보를 안전하게 처리하도록
        관리·감독합니다.
      </p>
    ),
  },
  {
    title: '제5조 개인정보의 파기 절차 및 방법',
    body: (
      <>
        <p>
          회사는 개인정보의 처리 목적이 달성되거나 보유기간이 끝난 경우 지체
          없이 해당 개인정보를 파기합니다. 다만, 관련 법령에 따라 보존해야 하는
          정보는 해당 기간 동안 별도 분리하여 보관한 뒤 파기합니다.
        </p>
        <p>
          전자적 파일 형태의 개인정보는 복구하기 어렵도록 안전한 방법으로
          삭제하며, 종이 문서 형태의 개인정보는 분쇄하거나 소각합니다.
        </p>
      </>
    ),
  },
  {
    title: '제6조 정보주체와 법정대리인의 권리 및 행사방법',
    body: (
      <p>
        정보주체는 회사에 대해 개인정보 열람, 정정, 삭제, 처리정지, 동의 철회,
        계정 삭제를 요청할 수 있습니다. 회사는 관련 법령에 따라 본인 확인 후
        지체 없이 조치합니다. 법정대리인은 만 14세 미만 아동의 개인정보에 대해
        같은 권리를 행사할 수 있습니다.
      </p>
    ),
  },
  {
    title: '제7조 개인정보의 안전성 확보조치',
    body: (
      <p>
        회사는 개인정보를 안전하게 보호하기 위해 접근 권한 관리, 소셜 로그인
        인증 정보 및 비밀번호 해시 보호, 개인정보 접근 기록 관리, 보안 업데이트,
        전송 구간 보호 등 기술적·관리적 보호조치를 취합니다.
      </p>
    ),
  },
  {
    title: '제8조 개인정보 자동 수집 장치의 설치·운영 및 거부',
    body: (
      <p>
        회사는 로그인 상태 유지와 보안을 위해 필수 쿠키를 사용할 수 있습니다.
        회원은 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 필수 쿠키를
        거부하는 경우 로그인 및 일부 서비스 이용이 제한될 수 있습니다.
      </p>
    ),
  },
  {
    title: '제9조 행태정보, 자동화된 결정 및 AI 학습 이용',
    body: (
      <>
        <p>
          회사는 현재 맞춤형 광고 제공을 목적으로 제3자가 회원의 행태정보를
          수집하도록 허용하지 않습니다.
        </p>
        <p>
          서비스는 회원의 풀이 기록과 정오답 정보를 바탕으로 오답 관리와 약점
          분석 결과를 제공할 수 있습니다. 이는 학습 지원을 위한 자동 처리이며,
          회원의 권리 또는 의무에 중대한 영향을 미치는 자동화된 결정에는
          해당하지 않습니다.
        </p>
        <p>
          회사는 회원이 입력하거나 생성한 개인정보를 별도의 AI 모델 학습
          목적으로 이용하지 않습니다. 향후 AI 모델 학습에 이용하려는 경우 사전에
          목적, 항목, 보유기간, 거부 방법 등을 고지하고 필요한 동의를
          받겠습니다.
        </p>
      </>
    ),
  },
  {
    title: '제10조 개인정보 보호책임자 및 권익침해 구제',
    body: (
      <>
        <p>
          회사는 개인정보 처리와 관련한 문의, 불만 처리 및 피해 구제를 위해
          개인정보 보호책임자를 지정합니다.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>개인정보 보호책임자: 기출봇 운영팀</li>
          <li>
            문의 방법: 서비스 내 문의 채널 또는 회사가 별도로 고지한 연락처
          </li>
        </ul>
        <p>
          정보주체는 개인정보 침해에 대한 상담 또는 구제를 개인정보침해신고센터,
          개인정보 분쟁조정위원회, 대검찰청, 경찰청 등 관계 기관에 신청할 수
          있습니다.
        </p>
      </>
    ),
  },
  {
    title: '제11조 개인정보처리방침의 변경',
    body: (
      <p>
        이 개인정보처리방침은 2026년 6월 1일부터 적용됩니다. 법령, 서비스,
        개인정보 처리 현황의 변경으로 방침이 수정되는 경우 시행 전 서비스 화면을
        통해 공지합니다.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <main
      className="
        mx-auto w-full max-w-4xl px-4 py-10
        sm:py-14
      "
    >
      <Link href="/" className="text-sm font-medium text-zinc-500">
        기출봇
      </Link>
      <header className="mt-8 border-b pb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
          개인정보처리방침
        </h1>
        <p className="mt-3 text-sm text-zinc-500">시행일: 2026년 6월 1일</p>
      </header>

      <div className="mt-8 space-y-8 text-sm/7 text-zinc-600">
        <p>
          회사는 개인정보 보호법 등 관련 법령을 준수하며, 정보주체의 개인정보를
          안전하게 처리하기 위해 다음과 같이 개인정보처리방침을 수립·공개합니다.
        </p>
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold text-zinc-900">
              {section.title}
            </h2>
            <div className="mt-3 space-y-3">{section.body}</div>
          </section>
        ))}
      </div>
    </main>
  );
}
