#!/bin/bash

if [ "$START_SCRIPT_ENV" = "index" ]; then
  node ./lib/indexer/main.js
elif [ "$START_SCRIPT_ENV" = "init" ]; then
  sqd migration:apply && node ./lib/indexer/main_init.js
else
  exit 1
fi