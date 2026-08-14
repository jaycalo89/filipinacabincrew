#!/usr/bin/env python3
"""Minify css/style.css -> css/style.min.css and js/main.js -> js/main.min.js.

Run after editing either source file:

    python tools/build.py

CSS is minified in-process. The minifier is string-aware: it tracks quote state
so that a "//" inside a URL, or braces inside a `content:` value or an inline
SVG data URI, are never mistaken for syntax.

JS is minified by terser (version pinned in package.json), which mangles and
compresses rather than only stripping comments and whitespace — roughly 30%
smaller than the hand-rolled pass this replaced. terser is required: if it
cannot be found the build stops rather than silently falling back to a
different minifier, because two minifiers producing two different main.min.js
files depending on the machine is exactly the drift this is meant to prevent.

Note on how terser is invoked: every call runs with its working directory set
to a temp dir and takes absolute paths for input and output. On Windows this
repo is reached over a UNC path (\\\\wsl.localhost\\...), and neither cmd nor
npm will accept a UNC working directory — but node itself handles UNC paths
passed as arguments perfectly well. Setting cwd elsewhere sidesteps the whole
problem.
"""
import os
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Keep in step with the devDependency in package.json.
TERSER_VERSION = "5.50.0"


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


def terser_command() -> list:
    """Return the argv prefix that runs terser, or [] if it cannot be found.

    Preference order: a local install in node_modules, then terser on PATH,
    then npx with the version pinned. The npx route needs the network the
    first time but means a fresh clone can build without `npm install`.
    """
    local = os.path.join(ROOT, "node_modules", "terser", "bin", "terser")
    if os.path.exists(local):
        node = shutil.which("node")
        if node:
            return [node, local]

    on_path = shutil.which("terser")
    if on_path:
        return [on_path]

    npx = shutil.which("npx")
    if npx:
        return [npx, "--yes", "terser@" + TERSER_VERSION]

    return []


def minify_js(src_path: str, dst_path: str) -> str:
    cmd = terser_command()
    if not cmd:
        raise SystemExit(
            "terser not found. Install node, then either:\n"
            "    npm install            (from a checkout on a local filesystem)\n"
            "or make sure `npx` is on PATH so the pinned version can be fetched."
        )

    argv = cmd + [src_path, "--compress", "--mangle", "--output", dst_path]
    try:
        # cwd is deliberately not the repo — see the note in the module docstring.
        proc = subprocess.run(argv, cwd=tempfile.gettempdir(),
                              capture_output=True, text=True)
    except OSError as exc:
        raise SystemExit("could not run terser: %s" % exc)

    if proc.returncode != 0:
        raise SystemExit("terser failed:\n%s" % (proc.stderr.strip() or proc.stdout.strip()))


def write(path: str, text: str) -> None:
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)


def report(src_path: str, dst_path: str) -> None:
    """Sizes are read back off disk, in bytes.

    Counting the length of the Python string instead would undercount: the
    site's copy uses em dashes and ellipses, which are three bytes each in
    UTF-8 but one character to len().
    """
    src_len = os.path.getsize(src_path)
    dst_len = os.path.getsize(dst_path)
    saved = 100 - (dst_len * 100 // max(src_len, 1))
    print(f"  {os.path.relpath(dst_path, ROOT):24s} {src_len:>7,} -> {dst_len:>7,} bytes  (-{saved}%)")


JS_SOURCES = ("js/main.js", "js/cookie-consent.js")


def main() -> int:
    print("Building Filipina Cabin Crew assets…")

    for src_rel in ("css/style.css",) + JS_SOURCES:
        if not os.path.exists(os.path.join(ROOT, src_rel)):
            print(f"  missing source: {src_rel}", file=sys.stderr)
            return 1

    css_src = os.path.join(ROOT, "css/style.css")
    css_dst = os.path.join(ROOT, "css/style.min.css")
    write(css_dst, minify_css(open(css_src, encoding="utf-8").read()))
    report(css_src, css_dst)

    for src_rel in JS_SOURCES:
        js_src = os.path.join(ROOT, src_rel)
        js_dst = os.path.join(ROOT, src_rel[:-3] + ".min.js")
        minify_js(js_src, js_dst)            # terser writes the file itself
        report(js_src, js_dst)

    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
