# The Licensed Work is (c) 2024 Sygma
# SPDX-License-Identifier: LGPL-3.0-only
FROM node:18-alpine AS builder

# update packages
RUN apk update

# install git
RUN apk add --no-cache git

# create root application folder
WORKDIR /app

# copy configs to /app folder
COPY .yarnrc.yml ./
COPY package*.json ./
COPY tsconfig.json ./
COPY yarn.lock ./

RUN yarn install --frozen-lockfile

# copy source code to /app/src folder
COPY . .

# check files list
RUN ls -a

RUN yarn build

FROM node:18-alpine
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/envs ./envs
COPY --from=builder /app/db ./db
LABEL org.opencontainers.image.source https://github.com/sygmaprotocol/squid-indexer/
EXPOSE 8000

ARG START_SCRIPT
ENV START_SCRIPT_ENV=$START_SCRIPT
COPY scripts/$START_SCRIPT_ENV /$START_SCRIPT_ENV

ENTRYPOINT sh /$START_SCRIPT_ENV
