#!/bin/sh
# Build, screenshot and check one pass: sh run.sh <pass> [only,ids]. Shots go to $SHOTS (default ./.shots, not committed).
set -e
D=$(cd "$(dirname "$0")" && pwd); W=${SHOTS:-$D/../.shots}; mkdir -p "$W"
python3 "$D/build.py" "$W/artifact.html"
rm -rf "$W/shots/p$1"; node "$D/shoot.cjs" "$1" "$W/shots/p$1" $2
