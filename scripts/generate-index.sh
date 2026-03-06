#!/bin/bash
# Usage: bash scripts/generate-index.sh <reports-dir>

REPORTS_DIR="${1:?Usage: $0 <reports-dir>}"

{
  cat <<'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="robots" content="nofollow,noarchive,noindex">
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <meta name="generator" content="github.com/gacts/directory-listing"/>
    <title>Hacker News testing reports</title>
    <style>
        :root { --color-text-primary: #444; --color-text-secondary: #111; --color-bg-primary: #ddd; --color-bg-secondary: #bbb; }
        @media (prefers-color-scheme: dark) { :root { --color-text-primary: #bbb; --color-text-secondary: #eee; --color-bg-primary: #242424; --color-bg-secondary: #444; } }
        html, body { margin: 0; padding: 0; background-color: var(--color-bg-primary); color: var(--color-text-primary); font-family: ui-sans-serif, system-ui, sans-serif; }
        body { display: flex; flex-direction: column; margin: 2em 1.25em; font-size: 16px; }
        @media screen and (max-width: 480px) { body { font-size: 14px; } }
        @media screen and (min-width: 1800px) { body, html { font-size: 20px; } }
        a { color: var(--color-text-secondary); font-weight: 500; text-decoration: none; }
        a:hover { opacity: 0.85; transition: opacity 0.2s linear; text-decoration: underline; }
        a:visited { color: var(--color-text-secondary); }
        header, main { padding: 0 2rem; }
        header { margin-bottom: 1rem; }
        main { overflow: auto; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 1.25rem 1rem; border-bottom: 1px solid var(--color-bg-secondary); text-align: left; white-space: nowrap; }
        th.name, td.name { text-align: left; }
        th.status, td.status { width: 10%; text-align: center; }
        td.status.success { color: #2da44e; }
        td.status.failure { color: #cf222e; }
        th.sha, td.sha { width: 10%; text-align: center; font-family: monospace; }
        tbody > tr:last-child > td { border-bottom: none; }
        footer { text-align: center; padding: 1rem 0; }
    </style>
</head>
<body>
    <header><h1>Hacker News testing reports</h1></header>
    <main>
        <table>
            <thead><tr><th class="name">Name</th><th class="status">Result</th><th class="sha">Commit</th></tr></thead>
            <tbody>
EOF

  ls -d "$REPORTS_DIR"/*/ | xargs -I{} basename {} | sort -rn | while read dir; do
    sha_full=$(cat "$REPORTS_DIR/$dir/.sha" 2>/dev/null || echo "")
    sha_short="${sha_full:0:7}"
    status=$(cat "$REPORTS_DIR/$dir/.status" 2>/dev/null || echo "-")
    if [ -n "$sha_full" ]; then
      sha_cell="<a href=\"https://github.com/gabrielchouinardletourneau/solid-waffle/commit/$sha_full\">$sha_short</a>"
    else
      sha_cell="-"
    fi
    echo "            <tr><td class=\"name\"><a href=\"./$dir\">$dir</a></td><td class=\"status $status\">$status</td><td class=\"sha\">$sha_cell</td></tr>"
  done

  cat <<'EOF'
            </tbody>
        </table>
    </main>
    <footer>
        Repository <a href="https://github.com/gabrielchouinardletourneau/solid-waffle">gabrielchouinardletourneau/solid-waffle</a>
    </footer>
</body>
</html>
EOF
} > "$REPORTS_DIR/index.html"
