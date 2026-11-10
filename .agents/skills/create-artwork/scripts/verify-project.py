#!/usr/bin/env python3
"""
Rikemen Creative Coding Lab プロジェクト整合性検証スクリプト。

以下の5項目を一括検証し、問題があれば非ゼロ終了コードで詳細を報告する:
1. JSON設定ファイル（firebase.json, jsconfig.json）の構文妥当性
2. 全JavaScriptファイルの構文チェック（node --check）
3. 全HTML・JS・カタログ定義内の相対パス実在確認（大文字・小文字の厳密一致を含む）
4. works/<id>/ 配下の必須4ファイル存在確認と、start/end 間の sketch.js・types.js 完全一致確認
5. works/ 配下の全作品ディレクトリが assets/js/catalog.js に登録されているかの確認
"""

from __future__ import annotations

import json
import pathlib
import re
import subprocess
import sys

REQUIRED_WORK_FILES = ("index.html", "types.js", "repository.js", "sketch.js")
IDENTICAL_WORK_FILES = ("types.js", "sketch.js")


def exists_with_exact_case(target_path: pathlib.Path, repo_root: pathlib.Path) -> bool:
    """macOS等の大文字小文字を区別しないファイルシステム上でも、本番Hosting(Linux)同様に厳密なファイル名一致を検証する。"""
    if not target_path.exists():
        return False
    try:
        rel_parts = target_path.relative_to(repo_root).parts
    except ValueError:
        return target_path.exists()

    current = repo_root
    for part in rel_parts:
        actual_names = {child.name for child in current.iterdir()}
        if part not in actual_names:
            return False
        current = current / part
    return True


def main() -> int:
    repo_root = pathlib.Path(__file__).resolve().parents[4]
    errors: list[str] = []

    # 1. JSON設定ファイルの構文検証
    for json_name in ("firebase.json", "jsconfig.json"):
        json_path = repo_root / json_name
        if not json_path.exists():
            errors.append(f"[JSON欠落] {json_name} が存在しません。")
            continue
        try:
            json.loads(json_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            errors.append(f"[JSON構文エラー] {json_name}: {exc}")

    # 2. JavaScript構文チェック (node --check)
    js_files = sorted(
        p for p in repo_root.rglob("*.js") if ".agents" not in p.parts and "node_modules" not in p.parts
    )
    for js_path in js_files:
        result = subprocess.run(
            ["node", "--check", str(js_path)],
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode != 0:
            rel_js = js_path.relative_to(repo_root)
            errors.append(f"[JS構文エラー] {rel_js}:\n{result.stderr.strip()}")

    # 3. HTML/JS/カタログ内の相対パス参照チェック（大文字・小文字厳密一致）
    html_files = sorted(
        p for p in repo_root.rglob("*.html") if ".agents" not in p.parts and "node_modules" not in p.parts
    )
    for html_path in html_files:
        content = html_path.read_text(encoding="utf-8")
        if 'name="viewport"' not in content:
            errors.append(
                f"[レスポンシブ設定欠落] {html_path.relative_to(repo_root)} に viewport meta タグがありません。"
            )
        for match in re.finditer(r'(?:src|href)="(\./[^"]+)"', content):
            raw_ref = match.group(1).split("?")[0].split("#")[0]
            resolved = (html_path.parent / raw_ref).resolve()
            if not exists_with_exact_case(resolved, repo_root):
                errors.append(
                    f"[HTMLリンク切れ・大小文字不一致] {html_path.relative_to(repo_root)} -> {raw_ref}"
                )

    for js_path in js_files:
        content = js_path.read_text(encoding="utf-8")
        for match in re.finditer(r"""from\s+["'](\.[^"']+)["']""", content):
            raw_import = match.group(1)
            resolved = (js_path.parent / raw_import).resolve()
            if not exists_with_exact_case(resolved, repo_root):
                errors.append(
                    f"[JS import切れ・大小文字不一致] {js_path.relative_to(repo_root)} -> {raw_import}"
                )

    catalog_files = [
        repo_root / "assets" / "js" / "catalog.js",
        repo_root / "assets" / "js" / "characters.js",
    ]
    for cat_file in catalog_files:
        if not cat_file.exists():
            continue
        cat_text = cat_file.read_text(encoding="utf-8")
        for asset_match in re.finditer(r"""(?:imagePath|thumbnailUrl):\s*["'](\./[^"']+)["']""", cat_text):
            raw_asset = asset_match.group(1)
            resolved_asset = (repo_root / raw_asset).resolve()
            if not exists_with_exact_case(resolved_asset, repo_root):
                errors.append(
                    f"[カタログ画像パス切れ・大小文字不一致] {cat_file.relative_to(repo_root)} -> {raw_asset}"
                )

    # 4. works/ 配下の構造および start/end 完全一致チェック
    works_dir = repo_root / "works"
    artworks_dir = repo_root / "assets" / "js" / "artworks"
    all_catalog_text = ""
    if (repo_root / "assets" / "js" / "catalog.js").exists():
        all_catalog_text += (repo_root / "assets" / "js" / "catalog.js").read_text(encoding="utf-8")
    if artworks_dir.exists():
        for art_file in artworks_dir.glob("*.js"):
            all_catalog_text += "\n" + art_file.read_text(encoding="utf-8")

    if works_dir.exists():
        for work_dir in sorted(p for p in works_dir.iterdir() if p.is_dir()):
            work_id = work_dir.name
            if work_id.startswith("_"):
                continue  # _template などの雛形フォルダはカタログ登録必須チェックから除外

            for stage in ("start", "end"):
                stage_dir = work_dir / stage
                if not stage_dir.is_dir():
                    errors.append(f"[ディレクトリ欠落] works/{work_id}/{stage}/ が存在しません。")
                    continue
                for req_file in REQUIRED_WORK_FILES:
                    if not (stage_dir / req_file).is_file():
                        errors.append(
                            f"[必須ファイル欠落] works/{work_id}/{stage}/{req_file} が存在しません。"
                        )

                work_html = stage_dir / "index.html"
                if work_html.is_file():
                    work_html_text = work_html.read_text(encoding="utf-8")
                    if "100dvh" not in work_html_text or "touch-action: none" not in work_html_text:
                        errors.append(
                            f"[スマホ最適化欠落] works/{work_id}/{stage}/index.html に 100dvh または touch-action: none が設定されていません。"
                        )

                work_sketch = stage_dir / "sketch.js"
                if work_sketch.is_file():
                    work_sketch_text = work_sketch.read_text(encoding="utf-8")
                    if "windowResized" not in work_sketch_text:
                        errors.append(
                            f"[リサイズ追従欠落] works/{work_id}/{stage}/sketch.js に windowResized が実装されていません。"
                        )

            for synced_file in IDENTICAL_WORK_FILES:
                start_file = work_dir / "start" / synced_file
                end_file = work_dir / "end" / synced_file
                if start_file.is_file() and end_file.is_file():
                    if start_file.read_text(encoding="utf-8") != end_file.read_text(encoding="utf-8"):
                        errors.append(
                            f"[Start/End不一致] works/{work_id}/ の start/{synced_file} と end/{synced_file} に差分があります。"
                        )

            # 5. カタログ登録漏れチェック
            id_pattern = rf"""id:\s*["']{re.escape(work_id)}["']"""
            if not re.search(id_pattern, all_catalog_text):
                errors.append(
                    f"[カタログ未登録] works/{work_id} が assets/js/catalog.js または assets/js/artworks/ に登録されていません。"
                )

    if errors:
        print("❌ プロジェクト整合性エラーが検出されました:", file=sys.stderr)
        for err in errors:
            print(f"  - {err}", file=sys.stderr)
        return 1

    print(
        f"✅ 検証完了: JS {len(js_files)}件 / HTML {len(html_files)}件 / 画像パス・Start-End同期・カタログ整合性すべて正常です。"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
