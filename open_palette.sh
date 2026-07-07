#!/usr/bin/env bash
set -euo pipefail
exec "$HERDR_BIN_PATH" plugin pane open --plugin "$HERDR_PLUGIN_ID" --entrypoint palette
