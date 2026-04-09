#!/usr/bin/env bash
set -euo pipefail

PROJECT_PATH="${1:-./tiled/project.tiled-project}"
MAP_PATH="${2:-./tiled/maps/main.tmx}"
OUTPUT_PATH="${3:-./tiled/maps/main.export.json}"

if [[ "${USE_XVFB:-0}" == "1" ]]; then
  xvfb-run -a tiled --project "${PROJECT_PATH}" --export-map "${MAP_PATH}" "${OUTPUT_PATH}"
else
  tiled --project "${PROJECT_PATH}" --export-map "${MAP_PATH}" "${OUTPUT_PATH}"
fi

echo "Exported: ${OUTPUT_PATH}"
