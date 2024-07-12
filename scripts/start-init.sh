#!/bin/bash

yarn migration:apply && \
node --require=dotenv/config ./lib/main_init.js dotenv_config_path=envs/.env.init
