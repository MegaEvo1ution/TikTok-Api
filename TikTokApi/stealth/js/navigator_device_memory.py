"""
Navigator Device Memory and Connection API Spoofing

Loads the navigator device memory and connection spoofing JavaScript from the .js file.
"""
from pathlib import Path

_js_file = Path(__file__).parent / "navigator_device_memory.js"
navigator_device_memory = _js_file.read_text(encoding="utf-8")
