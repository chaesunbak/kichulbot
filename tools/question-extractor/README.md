# Question Extractor

관리자 문항 등록 전에 기출 PDF를 문항별 PNG 이미지와 `manifest.json`으로 변환하는 운영 도구입니다.

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

짝수형 또는 두 형식을 추출할 수도 있습니다.

```bash
python3 extract_questions.py input/한국사영역_문제지.pdf --form even --out output
python3 extract_questions.py input/한국사영역_문제지.pdf --form both --out output
```

기본 DPI는 `216`입니다. 필요하면 `--dpi 300`처럼 변경합니다.

## Output

```text
output/
├── manifest.json
├── q01.png
├── q02.png
└── ...
```

`manifest.json`에는 원본 PDF 이름, DPI, 문항 번호, 형식, 페이지, 단, 이미지 경로, 크기, PDF 좌표, 그림 포함 여부가 기록됩니다.
