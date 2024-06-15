#!/usr/bin/env bash
set -uo pipefail

signal=0
DATE=$(date -d "2 week ago" '+%Y-%m-%d')

function run {
  repo=$1
  echo "Run ${repo}"
  deno run -A main.ts -R $repo --created ">${DATE}" > /dev/null
  signal=$(( $signal + $?))
}
run "Kesin11/CIAnalyzer"
run "Kesin11/junit2json-rs"
run "Kesin11/actions-timeline"
run "Kesin11/gh-workflow-ls"
run "kesin11-private/self-hosted-sandbox"

if (( $signal > 0 )); then
  echo "${signal} Test failed"
  exit 1
fi
