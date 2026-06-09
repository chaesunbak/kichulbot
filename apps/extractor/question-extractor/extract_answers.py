#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Extract answer keys from answer-sheet PDFs into JSON.

The script expects answer rows shaped like:
  1 ⑤ 1  11 ④ 2  21 ① 3

Dependencies: pip install pdfplumber
Usage:
  python3 extract_answers.py "input/78회 한국사_답지(심화).pdf" --out output
"""

import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    pdfplumber = None


DEFAULT_OUT_ROOT = "output"
DEFAULT_FILENAME = "answers.json"

CIRCLED_ANSWERS = {
    "①": 1,
    "②": 2,
    "③": 3,
    "④": 4,
    "⑤": 5,
}

ANSWER_INDEXES = {
    **CIRCLED_ANSWERS,
    "1": 1,
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
}

ANSWER_ROW_RE = re.compile(
    r"(?<!\d)(?P<number>\d{1,3})\s+"
    r"(?P<answer>[①②③④⑤1-5])\s+"
    r"(?P<points>\d{1,2})(?!\d)"
)


def ensure_dependencies():
    if pdfplumber is None:
        sys.exit("의존성 필요:  pip install pdfplumber")


def output_dir_for_pdf(pdf_path, out_root):
    stem = unicodedata.normalize("NFC", Path(pdf_path).stem)
    safe_stem = re.sub(r"[^0-9A-Za-z가-힣._-]+", "_", stem).strip("._-")
    return Path(out_root) / (safe_stem or "pdf")


def parse_answer_text(text, page_number):
    answers = []
    for match in ANSWER_ROW_RE.finditer(text):
        number = int(match.group("number"))
        answer = match.group("answer")
        answers.append({
            "number": number,
            "answer": answer,
            "answer_index": ANSWER_INDEXES[answer],
            "points": int(match.group("points")),
            "page": page_number,
        })
    return answers


def normalize_answers(answers):
    by_number = {}
    duplicates = []

    for answer in answers:
        number = answer["number"]
        if number in by_number:
            duplicates.append(number)
            continue
        by_number[number] = answer

    normalized = [by_number[number] for number in sorted(by_number)]
    warnings = []

    if duplicates:
        warnings.append(
            "중복 문항 번호가 있어 처음 발견된 값만 사용했습니다: "
            + ", ".join(str(number) for number in sorted(set(duplicates)))
        )

    if normalized:
        expected = set(range(normalized[0]["number"], normalized[-1]["number"] + 1))
        actual = {answer["number"] for answer in normalized}
        missing = sorted(expected - actual)
        if missing:
            warnings.append(
                "연속 문항 번호 중 누락된 번호가 있습니다: "
                + ", ".join(str(number) for number in missing)
            )

    return normalized, warnings


def extract(pdf_path, out_dir, filename=DEFAULT_FILENAME):
    ensure_dependencies()
    pdf_path = Path(pdf_path)
    out_dir = Path(out_dir)
    raw_answers = []

    with pdfplumber.open(pdf_path) as pdf:
        for page_index, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            raw_answers.extend(parse_answer_text(text, page_index))

    answers, warnings = normalize_answers(raw_answers)
    result = {
        "source": pdf_path.name,
        "answer_count": len(answers),
        "total_points": sum(answer["points"] for answer in answers),
        "answers": answers,
    }
    if warnings:
        result["warnings"] = warnings

    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / filename
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"✓ {len(answers)}개 답안 추출 완료 → {out_path}")
    print(f"  총점={result['total_points']}")
    if warnings:
        for warning in warnings:
            print(f"  경고: {warning}")
    return result


def main():
    parser = argparse.ArgumentParser(description="답안지 PDF에서 정답/배점 JSON 추출")
    parser.add_argument("pdf", help="입력 답안지 PDF 경로")
    parser.add_argument(
        "--out",
        default=DEFAULT_OUT_ROOT,
        help="출력 루트 폴더 (기본: output, 실제 결과는 output/<PDF 파일명>/)",
    )
    parser.add_argument(
        "--filename",
        default=DEFAULT_FILENAME,
        help=f"출력 JSON 파일명 (기본: {DEFAULT_FILENAME})",
    )
    args = parser.parse_args()

    out_dir = output_dir_for_pdf(args.pdf, args.out)
    extract(args.pdf, out_dir, filename=args.filename)


if __name__ == "__main__":
    main()
