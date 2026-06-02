#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
기출 PDF에서 문항별 이미지를 자동 추출하는 운영 도구.

상용 웹서비스에서도 사용하기 쉽도록 copyleft(AGPL) 없는 의존 라이브러리로 구성했다.

  - pdfplumber  (MIT)        : 텍스트 좌표 / 중앙 구분선(rects·lines) / 이미지 위치
  - pypdfium2   (Apache-2.0) : 페이지 렌더링 (PDFium, BSD)
  - Pillow      (HPND)       : 크롭 / 이미지 저장

원리(동일):
  1) 문항 번호 마커("1.", "2." … 13pt 전용폰트)를 좌표로 자동 검출
  2) 마커 x로 좌/우 단, y(top)로 세로 순서 → [현재 마커 ~ 다음 마커] 슬랩 분할
  3) 머리말/꼬리말은 마커 슬랩 밖이라 자동 제외
  4) 단 경계·여백·하단은 실제 콘텐츠 좌표에서 자동 산출
  5) 중앙 세로 구분선을 자동 검출해 크롭에서 제외
  6) 각 문항 영역을 고해상도로 렌더·크롭하여 webp/png/jpeg 저장 + manifest.json 생성

의존성:  pip install pdfplumber pypdfium2 Pillow
사용법:
  python3 extract_questions.py 한국사영역_문제지.pdf
  python3 extract_questions.py 한국사영역_문제지.pdf --variant even --dpi 300 --out assets
  python3 extract_questions.py 한국사영역_문제지.pdf --variant both --image-format webp
"""

import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path

try:
    import pdfplumber
    import pypdfium2 as pdfium
    from PIL import Image  # noqa: F401  (pypdfium2 to_pil 사용 시 필요)
except ImportError:
    pdfplumber = None
    pdfium = None


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

DEFAULT_LAYOUT = "csat"
DEFAULT_VARIANT = "odd"
DEFAULT_IMAGE_FORMAT = "webp"
DEFAULT_QUALITY = 82
DEFAULT_OUT_ROOT = "output"

LAYOUT_CHOICES = {
    "csat": "수능 2단형",
    "korean-history": "한능검 심화 2단형",
}

VARIANT_CHOICES = {
    "odd": "홀수형",
    "even": "짝수형",
    "both": "둘 다",
}

IMAGE_FORMAT_CHOICES = {
    "webp": "webp (권장: 용량 작음)",
    "png": "png (무손실, 용량 큼)",
    "jpeg": "jpeg (호환성 좋음)",
}

KOREAN_HISTORY_FIRST_BODY_TOP = 150
KOREAN_HISTORY_BODY_TOP = 68
KOREAN_HISTORY_FOOTER_GUARD_Y = 958
KOREAN_HISTORY_LEFT_X0 = 38
KOREAN_HISTORY_RIGHT_MARGIN = 42
KOREAN_HISTORY_CENTER_GAP = 8
KOREAN_HISTORY_ROW_THRESHOLD = 246
KOREAN_HISTORY_ROW_MIN_RATIO = 0.012
KOREAN_HISTORY_MIN_SEGMENT_HEIGHT = 18
KOREAN_HISTORY_MERGE_GAP = 34


@dataclass(frozen=True)
class ImageOptions:
    image_format: str = DEFAULT_IMAGE_FORMAT
    quality: int = DEFAULT_QUALITY
    webp_lossless: bool = False

    @property
    def extension(self):
        return "jpg" if self.image_format == "jpeg" else self.image_format


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


def ensure_dependencies():
    if pdfplumber is None or pdfium is None:
        sys.exit("의존성 필요:  pip install pdfplumber pypdfium2 Pillow")


def output_dir_for_pdf(pdf_path, out_root):
    """PDF 파일명 기준으로 겹치지 않는 출력 폴더를 만든다."""
    stem = Path(pdf_path).stem
    safe_stem = re.sub(r"[^0-9A-Za-z가-힣._-]+", "_", stem).strip("._-")
    return Path(out_root) / (safe_stem or "pdf")


def save_crop(crop, path, image_options):
    """크롭 이미지를 선택된 저용량 포맷으로 저장한다."""
    fmt = image_options.image_format
    if fmt == "webp":
        crop.save(
            path,
            "WEBP",
            quality=image_options.quality,
            method=6,
            lossless=image_options.webp_lossless,
        )
        return
    if fmt == "jpeg":
        crop.convert("RGB").save(
            path,
            "JPEG",
            quality=image_options.quality,
            optimize=True,
            progressive=True,
        )
        return
    if fmt == "png":
        crop.save(path, "PNG", optimize=True)
        return
    raise ValueError(f"지원하지 않는 이미지 형식: {fmt}")


def extract(pdf_path, out_dir, forms, dpi, image_options=None, layout=DEFAULT_LAYOUT):
    if layout == "korean-history":
        return extract_korean_history(pdf_path, out_dir, dpi, image_options=image_options)
    if layout != "csat":
        raise ValueError(f"지원하지 않는 문제지 형식: {layout}")
    ensure_dependencies()
    image_options = image_options or ImageOptions()

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

        manifest = {
            "source": Path(pdf_path).name,
            "layout": layout,
            "dpi": dpi,
            "image_format": image_options.image_format,
            "quality": image_options.quality if image_options.image_format in {"webp", "jpeg"} else None,
            "webp_lossless": image_options.webp_lossless if image_options.image_format == "webp" else None,
            "questions": [],
        }
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
                fname = f"q{mk['num']:02d}.{image_options.extension}"
                fpath = sub / fname
                save_crop(crop, fpath, image_options)
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
        quality_label = image_options.quality if image_options.image_format in {"webp", "jpeg"} else "n/a"
        print(f"  이미지 형식={image_options.image_format}, quality={quality_label}")
        print(f"  manifest: {Path(out_dir) / 'manifest.json'}")
        return manifest
    finally:
        plumb.close()
        render_doc.close()


def korean_history_column_bounds(page_width):
    center = page_width / 2.0
    return {
        "L": (KOREAN_HISTORY_LEFT_X0, center - KOREAN_HISTORY_CENTER_GAP),
        "R": (center + KOREAN_HISTORY_CENTER_GAP, page_width - KOREAN_HISTORY_RIGHT_MARGIN),
    }


def korean_history_body_top(page_index):
    return KOREAN_HISTORY_FIRST_BODY_TOP if page_index == 0 else KOREAN_HISTORY_BODY_TOP


def is_korean_history_content_pixel(pixel):
    r, g, b = pixel
    return (
        r < KOREAN_HISTORY_ROW_THRESHOLD
        or g < KOREAN_HISTORY_ROW_THRESHOLD
        or b < KOREAN_HISTORY_ROW_THRESHOLD
    )


def detect_korean_history_segments(pil, page_index, scale):
    """이미지 기반 한능검 PDF에서 좌/우 단의 문항 덩어리를 검출한다."""
    page_width = pil.width / scale
    body_top = korean_history_body_top(page_index)
    footer = min(KOREAN_HISTORY_FOOTER_GUARD_Y, pil.height / scale)
    pix = pil.load()
    segments = []

    for col, (x0_pt, x1_pt) in korean_history_column_bounds(page_width).items():
        x0 = max(0, round(x0_pt * scale))
        x1 = min(pil.width, round(x1_pt * scale))
        y0 = max(0, round(body_top * scale))
        y1 = min(pil.height, round(footer * scale))
        min_count = max(8, round((x1 - x0) * KOREAN_HISTORY_ROW_MIN_RATIO))
        content_rows = []

        for y in range(y0, y1):
            count = 0
            for x in range(x0, x1):
                if is_korean_history_content_pixel(pix[x, y]):
                    count += 1
            if count >= min_count:
                content_rows.append(y)

        groups = []
        merge_gap = round(KOREAN_HISTORY_MERGE_GAP * scale)
        for y in content_rows:
            if not groups or y - groups[-1][1] > merge_gap:
                groups.append([y, y])
            else:
                groups[-1][1] = y

        min_height = KOREAN_HISTORY_MIN_SEGMENT_HEIGHT * scale
        for top, bottom in groups:
            if bottom - top + 1 < min_height:
                continue
            segments.append({
                "column": col,
                "x0": x0_pt,
                "x1": x1_pt,
                "y0": max(body_top, top / scale - TOP_PAD),
                "y1": min(footer, bottom / scale + BOTTOM_PAD),
            })

    return sorted(segments, key=lambda s: (0 if s["column"] == "L" else 1, s["y0"]))


def crop_has_color(crop):
    """한능검 이미지 PDF용 느슨한 그림/컬러 자료 포함 추정값."""
    sample_step = max(1, min(crop.width, crop.height) // 240)
    sampled = 0
    colored = 0
    for y in range(0, crop.height, sample_step):
        for x in range(0, crop.width, sample_step):
            r, g, b = crop.getpixel((x, y))
            if r > 248 and g > 248 and b > 248:
                continue
            sampled += 1
            if max(r, g, b) - min(r, g, b) > 12:
                colored += 1
    return bool(sampled and colored / sampled > 0.03)


def extract_korean_history(pdf_path, out_dir, dpi, image_options=None):
    ensure_dependencies()
    image_options = image_options or ImageOptions()
    render_doc = pdfium.PdfDocument(pdf_path)
    Path(out_dir).mkdir(parents=True, exist_ok=True)

    try:
        scale = dpi / 72.0
        manifest = {
            "source": Path(pdf_path).name,
            "layout": "korean-history",
            "dpi": dpi,
            "image_format": image_options.image_format,
            "quality": image_options.quality if image_options.image_format in {"webp", "jpeg"} else None,
            "webp_lossless": image_options.webp_lossless if image_options.image_format == "webp" else None,
            "questions": [],
        }
        question_number = 1

        for pi in range(len(render_doc)):
            pil = render_doc[pi].render(scale=scale).to_pil().convert("RGB")
            segments = detect_korean_history_segments(pil, pi, scale)
            for segment in segments:
                box = (
                    segment["x0"],
                    segment["y0"],
                    segment["x1"],
                    segment["y1"],
                )
                px = (
                    max(0, round(box[0] * scale)),
                    max(0, round(box[1] * scale)),
                    min(pil.width, round(box[2] * scale)),
                    min(pil.height, round(box[3] * scale)),
                )
                crop = pil.crop(px)
                fname = f"q{question_number:02d}.{image_options.extension}"
                fpath = Path(out_dir) / fname
                save_crop(crop, fpath, image_options)
                manifest["questions"].append({
                    "number": question_number,
                    "form": None,
                    "page": pi + 1,
                    "column": segment["column"],
                    "image": fname,
                    "width_px": crop.width,
                    "height_px": crop.height,
                    "bbox_pt": [round(v, 1) for v in box],
                    "has_figure": crop_has_color(crop),
                })
                question_number += 1

        with open(Path(out_dir) / "manifest.json", "w", encoding="utf-8") as f:
            json.dump(manifest, f, ensure_ascii=False, indent=2)

        total = len(manifest["questions"])
        page_counts = {}
        for question in manifest["questions"]:
            page_counts[question["page"]] = page_counts.get(question["page"], 0) + 1

        print(f"✓ {total}개 문항 이미지 추출 완료 → {out_dir}/")
        print("  한능검 이미지 기반 레이아웃: " + ", ".join(
            f"{page}p={count}개" for page, count in sorted(page_counts.items())
        ))
        print(f"  이미지 형식={image_options.image_format}, DPI={dpi}")
        print(f"  manifest: {Path(out_dir) / 'manifest.json'}")
        return manifest
    finally:
        render_doc.close()


def choose_option(title, choices, default):
    """터미널에서 숫자/값 입력으로 옵션을 고르게 한다."""
    items = list(choices.items())
    default_index = next((i for i, (value, _) in enumerate(items, start=1) if value == default), 1)

    print(f"\n{title}")
    for i, (value, label) in enumerate(items, start=1):
        suffix = " (기본)" if value == default else ""
        print(f"  {i}. {label} [{value}]{suffix}")

    while True:
        raw = input(f"선택 [{default_index}]: ").strip()
        if not raw:
            return default
        if raw in choices:
            return raw
        if raw.isdigit():
            index = int(raw)
            if 1 <= index <= len(items):
                return items[index - 1][0]
        print("목록의 번호 또는 값을 입력해 주세요.")


def choose_int(title, default, min_value, max_value):
    print(f"\n{title}")
    while True:
        raw = input(f"값 입력 [{default}]: ").strip()
        if not raw:
            return default
        try:
            value = int(raw)
        except ValueError:
            print("숫자를 입력해 주세요.")
            continue
        if min_value <= value <= max_value:
            return value
        print(f"{min_value}~{max_value} 사이의 값을 입력해 주세요.")


def resolve_cli_options(args):
    interactive = not args.no_interactive and sys.stdin.isatty()

    layout = args.layout
    variant = args.variant
    image_format = args.image_format
    quality = args.quality

    if interactive:
        if layout is None:
            layout = choose_option("문제지 형식을 선택하세요.", LAYOUT_CHOICES, DEFAULT_LAYOUT)
        if variant is None:
            variant = choose_option("홀/짝 형식을 선택하세요.", VARIANT_CHOICES, DEFAULT_VARIANT)
        if image_format is None:
            image_format = choose_option("이미지 형식을 선택하세요.", IMAGE_FORMAT_CHOICES, DEFAULT_IMAGE_FORMAT)
        if quality is None and image_format in {"webp", "jpeg"}:
            quality = choose_int("이미지 품질을 선택하세요. 숫자가 높을수록 선명하지만 용량이 커집니다.", DEFAULT_QUALITY, 1, 100)

    layout = layout or DEFAULT_LAYOUT
    variant = variant or DEFAULT_VARIANT
    image_format = image_format or DEFAULT_IMAGE_FORMAT
    quality = DEFAULT_QUALITY if quality is None else quality

    if not 1 <= quality <= 100:
        raise SystemExit("--quality는 1~100 사이여야 합니다.")

    return layout, variant, ImageOptions(
        image_format=image_format,
        quality=quality,
        webp_lossless=args.webp_lossless,
    )


def main():
    ap = argparse.ArgumentParser(description="기출 PDF에서 문항별 이미지 추출")
    ap.add_argument("pdf", help="입력 PDF 경로")
    ap.add_argument("--out", default=DEFAULT_OUT_ROOT,
                    help="출력 루트 폴더 (기본: output, 실제 결과는 output/<PDF 파일명>/)")
    ap.add_argument("--layout", choices=sorted(LAYOUT_CHOICES), default=None,
                    help="문제지 형식: csat=수능 2단형, korean-history=한능검 심화 2단형")
    ap.add_argument("--variant", choices=sorted(VARIANT_CHOICES), default=None,
                    help="추출할 홀/짝 형식: odd=홀수형, even=짝수형, both=둘 다")
    ap.add_argument("--form", dest="variant", choices=sorted(VARIANT_CHOICES),
                    help="deprecated: --variant와 동일")
    ap.add_argument("--image-format", choices=sorted(IMAGE_FORMAT_CHOICES), default=None,
                    help="저장 이미지 형식: webp(기본), png, jpeg")
    ap.add_argument("--quality", type=int, default=None,
                    help="webp/jpeg 품질 1~100 (기본: 82)")
    ap.add_argument("--webp-lossless", action="store_true",
                    help="webp를 무손실로 저장")
    ap.add_argument("--no-interactive", action="store_true",
                    help="터미널 선택 없이 기본값/전달된 옵션으로 실행")
    ap.add_argument("--dpi", type=int, default=216, help="렌더 해상도 (기본 216)")
    args = ap.parse_args()
    layout, variant, image_options = resolve_cli_options(args)
    out_dir = output_dir_for_pdf(args.pdf, args.out)
    extract(args.pdf, out_dir, [variant], args.dpi, image_options=image_options, layout=layout)


if __name__ == "__main__":
    main()
