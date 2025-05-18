#!/usr/bin/env sh

cd ~/www/
FILE="index.html"
if command -v xdg-open >/dev/null; then
  xdg-open "$FILE"
  exit 1
fi
