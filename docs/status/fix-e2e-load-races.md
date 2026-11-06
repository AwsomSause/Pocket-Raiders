# Fix e2e load races

- w12Tools: the Tools room test jumps straight to each row instead of pressing ArrowDown up to 19 times (each press redraws the heavy Hub; the 19th row took about 40 s in total even on a quiet machine and timed out on CI).
- wiiMotion: two retries, because the glide test counts animation frames and a loaded CI machine can draw too few.
- Test-only change. Found in the CI run for #725.
