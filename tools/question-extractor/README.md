# Question Extractor

관리자 문항 등록 전에 기출 PDF를 문항별 이미지와 `manifest.json`으로 변환하는 운영 도구입니다.

이 도구는 관리자 프론트엔드나 API 서버의 런타임 일부가 아닙니다. 로컬에서 이미지를 추출한 뒤 관리자 화면 또는 API를 통해 등록할 때 사용합니다.

## Setup

```bash
cd tools/question-extractor
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Usage

입력 PDF는 `input/`, 추출 결과는 `output/`에 두는 것을 권장합니다. 두 디렉터리는 Git에서 제외됩니다.

```bash
python3 extract_questions.py input/한국사영역_문제지.pdf --out output
```

결과는 PDF 파일명별 폴더에 저장됩니다. 예를 들어 위 명령의 출력 경로는 `output/한국사영역_문제지/`입니다.

옵션 없이 실행하면 터미널에서 문제지 형식, 홀/짝 형식, 이미지 형식을 선택할 수 있습니다.

```text
문제지 형식을 선택하세요.
  1. 수능 2단형 [csat] (기본)

홀/짝 형식을 선택하세요.
  1. 홀수형 [odd] (기본)
  2. 짝수형 [even]
  3. 둘 다 [both]

이미지 형식을 선택하세요.
  1. webp (권장: 용량 작음) [webp] (기본)
  2. png (무손실, 용량 큼) [png]
  3. jpeg (호환성 좋음) [jpeg]
```

자동화하거나 반복 실행할 때는 CLI 옵션을 직접 전달합니다.

```bash
python3 extract_questions.py input/한국사영역_문제지.pdf --variant even --out output
python3 extract_questions.py input/한국사영역_문제지.pdf --variant both --out output
python3 extract_questions.py input/한국사영역_문제지.pdf --image-format webp --quality 82 --out output
```

기존 `--form odd|even|both` 옵션도 호환성을 위해 계속 사용할 수 있습니다. 새 스크립트나 문서에서는 `--variant`를 사용합니다.

기본 DPI는 `216`입니다. 필요하면 `--dpi 300`처럼 변경합니다.

## Output

```text
output/
└── 한국사영역_문제지/
    ├── manifest.json
    ├── q01.webp
    ├── q02.webp
    └── ...
```

`manifest.json`에는 원본 PDF 이름, 문제지 형식, DPI, 이미지 형식, 문항 번호, 형식, 페이지, 단, 이미지 경로, 크기, PDF 좌표, 그림 포함 여부가 기록됩니다.
