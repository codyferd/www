#!/bin/sh

FILE="index.html"
if command -v xdg-open >/dev/null; then
  xdg-open "$FILE"
  exit 0
fi

# Fallback
echo "xdg-open not found"
exit 1