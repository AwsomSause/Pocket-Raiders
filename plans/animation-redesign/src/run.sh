#!/bin/sh
# Build, photograph and check one pass. sh plans/animation-redesign/src/run.sh <pass> [all | id,id]
set -e
D=$(cd "$(dirname "$0")" && pwd); W=${SHOTS:-/tmp/anim-shots}
python3 "$D/build.py" "$W/artifact.html"
rm -rf "$W/shots/p$1"; node "$D/shoot.cjs" "$1" "$W/shots/p$1" $2
python3 "$D/sheet.py" "$1" "$W/shots/p$1" "$W/sheets" 9
