#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
기출 PDF에서 문항별 이미지를 자동 추출하는 운영 도구.

상용 웹서비스에서도 사용하기 쉽도록 copyleft(AGPL) 없는 의존 라이브러리로 구성했다.

  - pdfplumber  (MIT)        : 텍스트 좌표 / 중앙 구분선(rects·lines) / 이미지 위치
  - pypdfium2   (Apache-2.0) : 페이지 렌더링 (PDFium, BSD)
  - Pillow      (HPND)       : 크롭 / PNG 저장

원리(동일):
  1) 문항 번호 마커("1.", "2." … 13pt 전용폰트)를 좌표로 자동 검출
  2) 마커 x로 좌/우 단, y(top)로 세로 순서 → [현재 마커 ~ 다음 마커] 슬랩 분할
  3) 머리말/꼬리말은 마커 슬랩 밖이라 자동 제외
  4) 단 경계·여백·하단은 실제 콘텐츠 좌표에서 자동 산출
  5) 중앙 세로 구분선을 자동 검출해 크롭에서 제외
  6) 각 문항 영역을 고해상도로 렌더·크롭하여 PNG 저장 + manifest.json 생성

의존성:  pip install pdfplumber pypdfium2 Pillow
사용법:
  python3 extract_questions.py 한국사영역_문제지.pdf
  python3 extract_questions.py 한국사영역_문제지.pdf --form even --dpi 300 --out assets
  python3 extract_questions.py 한국사영역_문제지.pdf --form both
"""

import argparse
import json
import re
import sys
from pathlib import Path

try:
    import pdfplumber
    import pypdfium2 as pdfium
    from PIL import Image  # noqa: F401  (pypdfium2 to_pil 사용 시 필요)
except ImportError:
    sys.exit("의존성 필요:  pip install pdfplumber pypdfium2 Pillow")


# ── 검출/크롭 파라미터 (대부분 자동 산출되지만 안전장치로 둔다) ──────────────
MARKER_RE = re.compile(r"^\d{1,2}\.$")           # "1.", "12." 같은 문항 번호
MARKER_SIZE_RANGE = (11.5, 14.5)                 # 문항 번호 글자 크기(pt) 허용 범위
HEADER_GUARD_Y = 150                             # 이 위(y<)는 머리말로 간주, 마커 무시
FOOTER_GUARD_Y = 1078                            # 이 아래(y>=)는 꼬리말로 간주, 본문 제외

TOP_PAD = 9        # 문항 번호 위로 띄울 여백(pt)
GAP = 7            # 같은 단 다음 문항과의 간격(pt) — 다음 문항 번호를 안 먹게
SIDE_PAD = 8       # 단 바깥쪽(좌/우) 여백(pt)
BOTTOM_PAD = 8     # 단 마지막 문항 아래 여백(pt)
DIVIDER_GAP = 2.5  # 중앙 구분선 안쪽으로 더 당길 간격(pt) — 구분선이 안 보이게


def detect_markers(pdf):
    """모든 페이지에서 문항 번호 마커를 검출한다.
    반환: [{num, page, form, x0, y0}], 페이지별 form('홀수형'/'짝수형'/None) 포함."""
    markers = []
    for pi, page in enumerate(pdf.pages):
        ptext = page.extract_text() or ""
        form = "홀수형" if "홀수형" in ptext else "짝수형" if "짝수형" in ptext else None
        for w in page.extract_words(extra_attrs=["size"]):
            if not MARKER_RE.match(w["text"]):
                continue
            size = w.get("size", 0)
            if not (MARKER_SIZE_RANGE[0] <= size <= MARKER_SIZE_RANGE[1]):
                continue
            if w["top"] < HEADER_GUARD_Y:          # 머리말 영역의 숫자 제외
                continue
            markers.append({"num": int(w["text"][:-1]), "page": pi,
                            "form": form, "x0": w["x0"], "y0": w["top"]})
    return markers


def content_blocks(page):
    """페이지의 본문 요소(단어 박스 + 이미지)를 (x0,y0,x1,y1,is_image) 로 반환.
    (좌표는 모두 top 기준 = 위에서 아래로 증가, pdfplumber 기본)"""
    out = []
    for w in page.extract_words():
        out.append((w["x0"], w["top"], w["x1"], w["bottom"], False))
    for im in page.images:
        out.append((im["x0"], im["top"], im["x1"], im["bottom"], True))
    return out


def find_divider(pdf, center):
    """두 단 사이의 중앙 세로 구분선(얇고 긴 세로 막대/선)을 자동 검출.
    반환: (x0, x1) 구분선의 가로 범위. 못 찾으면 (center, center)."""
    cand = []
    for page in pdf.pages:
        h = page.height
        for r in page.rects:                       # 얇은 세로 사각형
            if r["width"] < 4 and r["height"] > h * 0.3 and abs((r["x0"] + r["x1"]) / 2 - center) < 40:
                cand.append((r["x0"], r["x1"]))
        for l in page.lines:                       # 세로 선분
            if abs(l["x1"] - l["x0"]) < 1.5 and (l["bottom"] - l["top"]) > h * 0.3 and abs(l["x0"] - center) < 40:
                cand.append((min(l["x0"], l["x1"]), max(l["x0"], l["x1"])))
    if not cand:
        return center, center
    cand.sort(key=lambda c: abs((c[0] + c[1]) / 2 - center))
    return cand[0]


def compute_geometry(pdf, markers):
    """마커 슬랩 안에 들어오는 실제 콘텐츠로부터 단 경계·여백·하단·구분선을 자동 산출."""
    center = pdf.pages[0].width / 2.0

    # 1) 페이지·단별로 마커를 모아 세로 슬랩(top/한계bottom/실제content)을 만든다.
    slabs = {}  # (page, col) -> list of slab dict
    by_pc = {}
    for mk in markers:
        col = "L" if mk["x0"] < center else "R"
        by_pc.setdefault((mk["page"], col), []).append(mk)
    for (pi, col), mks in by_pc.items():
        mks.sort(key=lambda m: m["y0"])
        lst = []
        for i, mk in enumerate(mks):
            top = mk["y0"] - TOP_PAD
            limit = mks[i + 1]["y0"] - GAP if i + 1 < len(mks) else FOOTER_GUARD_Y
            lst.append({"num": mk["num"], "top": top, "limit": limit, "content": top})
        slabs[(pi, col)] = lst

    # 2) 슬랩 안에 들어오는 콘텐츠로 단별 x 범위 / 각 문항의 실제 하단을 측정.
    left_x0 = right_x0 = float("inf")
    left_x1 = right_x1 = float("-inf")
    real_bottom = 0.0
    for pi, page in enumerate(pdf.pages):
        for (bx0, by0, bx1, by1, is_img) in content_blocks(page):
            if by0 >= FOOTER_GUARD_Y:              # 꼬리말 제외
                continue
            col = "L" if (bx0 + bx1) / 2 < center else "R"
            slab = next((s for s in slabs.get((pi, col), []) if s["top"] <= by0 < s["limit"]), None)
            if slab is None:                       # 머리말/꼬리말은 어떤 슬랩에도 안 들어감
                continue
            slab["content"] = max(slab["content"], by1)
            if col == "L":
                left_x0, left_x1 = min(left_x0, bx0), max(left_x1, bx1)
            else:
                right_x0, right_x1 = min(right_x0, bx0), max(right_x1, bx1)
            real_bottom = max(real_bottom, by1)

    # 3) 중앙 구분선 → 좌/우 안쪽 경계를 구분선 바깥으로 당긴다 (구분선 제외).
    div_x0, div_x1 = find_divider(pdf, center)
    if left_x1 < div_x0 and div_x1 < right_x0:
        left_inner = div_x0 - DIVIDER_GAP
        right_inner = div_x1 + DIVIDER_GAP
    elif left_x1 < right_x0:
        left_inner = right_inner = (left_x1 + right_x0) / 2
    else:
        left_inner = right_inner = center
    return {
        "center": center,
        "divider": (div_x0, div_x1),
        "left_inner": left_inner,
        "right_inner": right_inner,
        "left_bound": left_x0 - SIDE_PAD,
        "right_bound": right_x1 + SIDE_PAD,
        "bottom": min(real_bottom + BOTTOM_PAD, FOOTER_GUARD_Y),
        "slabs": slabs,
    }


def question_box(geom, col, slab):
    """문항 크롭 사각형 (x0, y0, x1, y1) point 단위, y는 top 기준."""
    if col == "L":
        x0, x1 = geom["left_bound"], geom["left_inner"]
    else:
        x0, x1 = geom["right_inner"], geom["right_bound"]
    y0 = slab["top"]
    y1 = min(slab["content"] + BOTTOM_PAD, slab["limit"], geom["bottom"])
    return (x0, y0, x1, y1)


def slab_has_figure(page, box):
    """해당 영역 안에 이미지(그림/지도/사료)가 있는지."""
    x0, y0, x1, y1 = box
    for im in page.images:
        cx, cy = (im["x0"] + im["x1"]) / 2, (im["top"] + im["bottom"]) / 2
        if x0 <= cx <= x1 and y0 <= cy <= y1:
            return True
    return False


def extract(pdf_path, out_dir, forms, dpi):
    plumb = pdfplumber.open(pdf_path)         # 좌표/구분선/이미지 위치
    render_doc = pdfium.PdfDocument(pdf_path)  # 렌더링
    try:
        markers = detect_markers(plumb)
        geom = compute_geometry(plumb, markers)
        scale = dpi / 72.0
        center = geom["center"]
        page_cache = {}  # page_index -> 렌더된 PIL 이미지(전체 페이지)

        def render_page(pi):
            if pi not in page_cache:
                bmp = render_doc[pi].render(scale=scale)
                page_cache[pi] = bmp.to_pil().convert("RGB")
            return page_cache[pi]

        available_forms = sorted({mk["form"] for mk in markers if mk["form"]})
        if forms == ["both"]:
            targets = available_forms or [None]
        else:
            wanted = {"odd": "홀수형", "even": "짝수형"}
            targets = [wanted[f] for f in forms]
        multi = len(targets) > 1

        manifest = {"source": Path(pdf_path).name, "dpi": dpi, "questions": []}
        total = 0
        for form in targets:
            fmarkers = [m for m in markers if m["form"] == form] if form else markers
            fmarkers.sort(key=lambda m: (m["page"], 0 if m["x0"] < center else 1, m["y0"]))
            sub = (Path(out_dir) / form) if (multi and form) else Path(out_dir)
            sub.mkdir(parents=True, exist_ok=True)

            for mk in fmarkers:
                pi = mk["page"]
                page = plumb.pages[pi]
                col = "L" if mk["x0"] < center else "R"
                slab = next((s for s in geom["slabs"][(pi, col)] if s["num"] == mk["num"]), None)
                if slab is None:
                    continue
                box = question_box(geom, col, slab)
                pil = render_page(pi)
                px = (round(box[0] * scale), round(box[1] * scale),
                      round(box[2] * scale), round(box[3] * scale))
                # 이미지 경계 안으로 클램프
                px = (max(0, px[0]), max(0, px[1]),
                      min(pil.width, px[2]), min(pil.height, px[3]))
                crop = pil.crop(px)
                fname = f"q{mk['num']:02d}.png"
                fpath = sub / fname
                crop.save(fpath)
                total += 1
                manifest["questions"].append({
                    "number": mk["num"],
                    "form": form,
                    "page": pi + 1,
                    "column": col,
                    "image": str(fpath.relative_to(out_dir)) if Path(fpath).is_relative_to(out_dir) else str(fpath),
                    "width_px": crop.width,
                    "height_px": crop.height,
                    "bbox_pt": [round(box[0], 1), round(box[1], 1), round(box[2], 1), round(box[3], 1)],
                    "has_figure": slab_has_figure(page, box),
                })

        manifest["questions"].sort(key=lambda q: (q["form"] or "", q["number"]))
        with open(Path(out_dir) / "manifest.json", "w", encoding="utf-8") as f:
            json.dump(manifest, f, ensure_ascii=False, indent=2)

        print(f"✓ {total}개 문항 이미지 추출 완료 → {out_dir}/")
        print(f"  중앙 구분선 x={geom['divider'][0]:.1f}~{geom['divider'][1]:.1f}pt (크롭에서 제외)")
        print(f"  좌단={geom['left_bound']:.0f}~{geom['left_inner']:.0f}, "
              f"우단={geom['right_inner']:.0f}~{geom['right_bound']:.0f}, "
              f"하단={geom['bottom']:.0f}pt, DPI={dpi}")
        print(f"  manifest: {Path(out_dir) / 'manifest.json'}")
        return manifest
    finally:
        plumb.close()
        render_doc.close()


def main():
    ap = argparse.ArgumentParser(description="기출 PDF에서 문항별 이미지 추출")
    ap.add_argument("pdf", help="입력 PDF 경로")
    ap.add_argument("--out", default="questions", help="출력 폴더 (기본: questions)")
    ap.add_argument("--form", default="odd", choices=["odd", "even", "both"],
                    help="추출할 형식: odd=홀수형(기본), even=짝수형, both=둘 다")
    ap.add_argument("--dpi", type=int, default=216, help="렌더 해상도 (기본 216)")
    args = ap.parse_args()
    extract(args.pdf, args.out, [args.form], args.dpi)


if __name__ == "__main__":
    main()
