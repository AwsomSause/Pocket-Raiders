#!/usr/bin/env python3
"""Downloads the latin woff2 of each Google Font (all OFL) into fonts/ and writes fonts/fonts.css."""
import re, os, urllib.request
FAM = "family=Anton&family=Alfa+Slab+One&family=Abril+Fatface&family=Rubik+Mono+One&family=Barlow+Condensed:ital,wght@0,500;0,700;0,800;1,600;1,800&family=Permanent+Marker&family=Jost:ital,wght@0,300;0,500;0,800;1,800&family=Fredoka:wght@400;600;700&family=Cinzel:wght@500;800&family=Cormorant+Garamond:ital,wght@0,500;0,700;1,600"
URL = "https://fonts.googleapis.com/css2?" + FAM + "&display=swap"
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
css = urllib.request.urlopen(urllib.request.Request(URL, headers={"User-Agent": UA})).read().decode()
out = os.path.join(os.path.dirname(__file__), "../fonts"); os.makedirs(out, exist_ok=True)
res = []
for m in re.finditer(r"/\* latin \*/\s*(@font-face\s*{[^}]*})", css):
    blk = m.group(1)
    fam = re.search(r"font-family: '([^']+)'", blk).group(1); wt = re.search(r"font-weight: (\d+)", blk).group(1)
    st = re.search(r"font-style: (\w+)", blk).group(1); u = re.search(r"url\((https:[^)]+)\)", blk).group(1)
    fn = f"{fam.replace(' ', '')}-{wt}{'i' if st == 'italic' else ''}.woff2"
    p = os.path.join(out, fn)
    if not os.path.exists(p): open(p, "wb").write(urllib.request.urlopen(u).read())
    res.append(f"@font-face{{font-family:'{fam}';font-style:{st};font-weight:{wt};font-display:swap;src:url({fn}) format('woff2')}}")
open(os.path.join(out, "fonts.css"), "w").write("\n".join(res) + "\n")
open(os.path.join(out, "google-url.txt"), "w").write(URL + "\n")
print(len(res), "faces")
