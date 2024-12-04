# The Licensed Work is (c) 2024 Sygma
# SPDX-License-Identifier: LGPL-3.0-only
FROM node:18-alpine AS builder

# update packages
RUN apk update

# install git
RUN apk add --no-cache git

# create root application folder
WORKDIR /squid

# enable corepack
RUN corepack enable

# copy configs to /squid folder
COPY .yarnrc.yml ./
COPY package*.json ./
COPY tsconfig.json ./
COPY yarn.lock ./

RUN corepack yarn install
 
# copy source code to /squid/src folder
COPY . .

RUN corepack yarn build

FROM node:18-alpine
COPY --from=builder /squid/node_modules ./node_modules
COPY --from=builder /squid/package*.json ./
COPY --from=builder /squid/lib ./lib
COPY --from=builder /squid/envs ./envs
#COPY --from=builder /squid/db ./db
COPY --from=builder /squid/start-prod.sh ./start-prod.sh
COPY --from=builder /squid/commands.json ./

RUN corepack yarn global add @subsquid/commands && mv $(which squid-commands) /usr/local/bin/sqd

LABEL org.opencontainers.image.source https://github.com/sygmaprotocol/squid-indexer/
EXPOSE 8000

ENTRYPOINT sh /start-prod.sh