"""
WebRTC Leak Prevention Script

Loads the WebRTC leak prevention JavaScript from the .js file.
"""
from pathlib import Path

_js_file = Path(__file__).parent / "webrtc_leak.js"
webrtc_leak = _js_file.read_text(encoding="utf-8")

