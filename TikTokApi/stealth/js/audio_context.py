"""
AudioContext Fingerprint Protection

Loads the audio context fingerprint protection JavaScript from the .js file.
"""
from pathlib import Path

_js_file = Path(__file__).parent / "audio_context.js"
audio_context = _js_file.read_text(encoding="utf-8")




