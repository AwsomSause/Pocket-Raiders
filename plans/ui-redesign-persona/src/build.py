#!/usr/bin/env python3
"""Builds index.html (for the repo, opens from disk) and artifact.html (for the live copy) from src/."""
import glob, json, os
H = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(H)
css = "\n".join(open(f).read() for f in sorted(glob.glob(H + "/css/*.css")))
js = "\n".join(open(f).read() for f in sorted(glob.glob(H + "/js/*.js")))
passes = json.load(open(H + "/passes.json"))
body = f"""<div class="vw">
<header class="vw-top"><h1>Pocket Raiders <em>Phantom UI</em></h1>
<div class="vw-step"><button id="vw-prev" type="button">Earlier pass</button><output id="vw-out" for="vw-pass"></output><button id="vw-next" type="button">Later pass</button><input id="vw-pass" type="range" min="1" max="25" step="1" aria-label="Pass"><button id="vw-tour" type="button">Play tour</button></div></header>
<div class="vw-nav" id="vw-liv" hidden></div>
<nav class="vw-nav" id="vw-nav" aria-label="Screens"></nav>
<div class="vw-stagewrap" id="vw-wrap"><div class="stage" id="stage"></div></div>
<section class="vw-notes" id="vw-notes" aria-live="polite"></section>
</div>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="rough" x="-10%" y="-20%" width="120%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".022 .06" numOctaves="3" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="26" xChannelSelector="R" yChannelSelector="G"/></filter><filter id="rough2" x="-5%" y="-10%" width="110%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="2" seed="9" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="9"/></filter></svg>
<script>const PASSES={json.dumps(passes, ensure_ascii=False)};</script>
<script>
{js}
</script>"""
title = "<title>Phantom UI Mockups</title>"
gurl = open(R + "/fonts/google-url.txt").read().strip().replace("&", "&amp;")
open(R + "/index.html", "w").write(f"<!doctype html>\n<html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n{title}\n<link rel=\"stylesheet\" href=\"fonts/fonts.css\">\n<style>\n{css}\n</style></head><body>\n{body}\n</body></html>\n")
open(R + "/artifact.html", "w").write(f"{title}\n<meta name=\"claude:viewport-fit-sides\" content=\"cover\">\n<link rel=\"stylesheet\" href=\"{gurl}\">\n<style>\n{css}\n</style>\n{body}\n")
print("built", len(passes), "passes,", round(len(css) / 1024), "KB css,", round(len(js) / 1024), "KB js")
