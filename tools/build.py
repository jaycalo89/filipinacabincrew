#!/usr/bin/env python3
"""Minify css/style.css -> css/style.min.css and js/main.js -> js/main.min.js.

Run after editing either source file:

    python tools/build.py

Both minifiers are string-aware: they track quote state so that a "//" inside
a URL, or braces inside a `content:` value or an inline SVG data URI, are never
mistaken for syntax. The JS pass is deliberately conservative — it strips
comments and indentation but keeps line breaks, so automatic semicolon
insertion cannot change the meaning of the file.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def minify_css(src: str) -> str:
    out = []
    i, n = 0, len(src)
    quote = None
    while i < n:
        ch = src[i]
        if quote:
            out.append(ch)
            if ch == "\\" and i + 1 < n:
                out.append(src[i + 1]); i += 2; continue
            if ch == quote:
                quote = None
            i += 1
            continue
        if ch in "\"'":
            quote = ch; out.append(ch); i += 1; continue
        if ch == "/" and i + 1 < n and src[i + 1] == "*":        # comment
            end = src.find("*/", i + 2)
            i = n if end == -1 else end + 2
            continue
        out.append(ch)
        i += 1

    css = "".join(out)
    # Collapse runs of whitespace outside of strings.
    parts = re.split(r"""("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')""", css)
    for k in range(0, len(parts), 2):                            # even = code
        t = re.sub(r"\s+", " ", parts[k])
        t = re.sub(r"\s*([{}:;,>~+])\s*", r"\1", t)
        t = t.replace(";}", "}")
        # `and(` / `:not(` style damage from the rule above, plus selector combinators
        t = t.replace("and(", "and (").replace(")and", ") and")
        t = re.sub(r"\b(min|max)-(width|height):", r"\1-\2: ", t)
        parts[k] = t
    css = "".join(parts).strip()
    return css


def minify_js(src: str) -> str:
    out = []
    i, n = 0, len(src)
    quote = None
    while i < n:
        ch = src[i]
        if quote:
            out.append(ch)
            if ch == "\\" and i + 1 < n:
                out.append(src[i + 1]); i += 2; continue
            if ch == quote:
                quote = None
            i += 1
            continue
        if ch in "\"'`":
            quote = ch; out.append(ch); i += 1; continue
        if ch == "/" and i + 1 < n and src[i + 1] == "*":
            end = src.find("*/", i + 2)
            i = n if end == -1 else end + 2
            continue
        if ch == "/" and i + 1 < n and src[i + 1] == "/":
            end = src.find("\n", i)
            i = n if end == -1 else end
            continue
        out.append(ch)
        i += 1

    lines = [ln.strip() for ln in "".join(out).splitlines()]
    return "\n".join(ln for ln in lines if ln)


def write(path: str, text: str, source_len: int) -> None:
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    saved = 100 - (len(text) * 100 // max(source_len, 1))
    print(f"  {os.path.relpath(path, ROOT):24s} {source_len:>7,} -> {len(text):>7,} bytes  (-{saved}%)")


def main() -> int:
    print("Building Filipina Cabin Crew assets…")
    jobs = [
        ("css/style.css", "css/style.min.css", minify_css),
        ("js/main.js", "js/main.min.js", minify_js),
    ]
    for src_rel, dst_rel, fn in jobs:
        src_path = os.path.join(ROOT, src_rel)
        if not os.path.exists(src_path):
            print(f"  missing source: {src_rel}", file=sys.stderr)
            return 1
        src = open(src_path, encoding="utf-8").read()
        write(os.path.join(ROOT, dst_rel), fn(src), len(src))
    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
