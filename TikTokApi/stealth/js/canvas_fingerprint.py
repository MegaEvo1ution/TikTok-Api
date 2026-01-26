"""
Canvas Fingerprint Randomization Script

Loads the canvas fingerprint randomization JavaScript from the .js file.
"""
from pathlib import Path

_js_file = Path(__file__).parent / "canvas_fingerprint.js"
canvas_fingerprint = _js_file.read_text(encoding="utf-8")
