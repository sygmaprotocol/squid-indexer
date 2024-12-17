#!/bin/bash

if [ "$START_SCRIPT_ENV" = "index" ]; then
  node ./lib/main.js
elif [ "$START_SCRIPT_ENV" = "init" ]; then
  sqd migration:apply && node ./lib/main_init.js
else
  exit 1
fi