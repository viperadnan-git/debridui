#!/usr/bin/env sh

set -e

START_TIME=$(date +%s%3N)

# Build sed script with all NEXT_PUBLIC_* replacements
SED_FILE=$(mktemp)
printenv | sed -n 's/^\(NEXT_PUBLIC_[^=]*\)=\(.*\)$/s|__\1__|\2|g/p' >> "$SED_FILE"
echo 's|__NEXT_PUBLIC_[A-Z_]*__||g' >> "$SED_FILE"

# Process all files in parallel
find .next -type f \( -name "*.js" -o -name "*.html" \) -print0 | \
  xargs -0 -P "$(nproc)" sed -i -f "$SED_FILE"

rm -f "$SED_FILE"

echo "Env injected in $(($(date +%s%3N) - START_TIME))ms"

exec "$@"
