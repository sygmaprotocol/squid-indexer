#!/bin/bash

yarn migration:generate && \
yarn migration:apply && \
node --require=dotenv/config ./lib/main_init.js
