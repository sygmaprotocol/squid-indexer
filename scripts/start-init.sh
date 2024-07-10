#!/bin/bash

yarn migration:apply && \
node --require=dotenv/config ./lib/main_init.js
