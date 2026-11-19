#!/bin/sh
# Build, screenshot and check one pass. sh plans/ui-redesign/src/run.sh <pass> [only,ids]
set -e
D=$(cd "$(dirname "$0")" && pwd); W=${SHOTS:-/tmp/claude-0/-home-user/bd05be79-b76b-5bb6-98fe-b881636ad2dd/scratchpad/w}
python3 "$D/build.py" "$W/artifact.html"
rm -rf "$W/shots/p$1"; node "$D/shoot.cjs" "$1" "$W/shots/p$1" $2
python3 "$D/sheet.py" "$1" "$W/shots/p$1" "$W/sheets" 12
