#!/usr/bin/env python3
"""Local preview server — python's http.server plus `Cache-Control: no-store`.

Assets are referenced with `?v=DEV`, which only changes at deploy time (the Pages
workflow stamps the git SHA). Locally the query never changes, so Chrome caches
styles.css / script.js heuristically and an edit looks like it did nothing. This
server disables that. Not deployed (excluded in .github/workflows/pages.yml).

    python3 serve.py            # http://localhost:4185/
    python3 serve.py 8000
"""
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoStore(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def log_message(self, fmt, *args):  # quieter than the default
        pass


port = int(sys.argv[1]) if len(sys.argv) > 1 else 4185
print(f"→ http://localhost:{port}/  (Ctrl-C to stop)")
ThreadingHTTPServer(("127.0.0.1", port), NoStore).serve_forever()
