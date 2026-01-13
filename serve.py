#!/usr/bin/env python3
import argparse
import http.server
import socketserver
import sys
import threading
import webbrowser


def parse_args():
    parser = argparse.ArgumentParser(
        description="Serve this portfolio locally and open it in a browser."
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Port to bind the local server (default: 8000)",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    handler = http.server.SimpleHTTPRequestHandler

    with socketserver.TCPServer(("", args.port), handler) as httpd:
        url = f"http://localhost:{args.port}"
        print(f"Serving on {url}")
        print("Press Ctrl+C to stop.")

        # Open the browser after the server starts.
        threading.Timer(0.5, lambda: webbrowser.open(url)).start()

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down.")
            sys.exit(0)


if __name__ == "__main__":
    main()
