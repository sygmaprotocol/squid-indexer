/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import winston from "winston";
import type Transports from "winston-transport";

export function getLogger(domainID?: string): winston.Logger {
  const transportsConfig: Transports[] = [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.align(),
      ),
    }),
  ];

  return winston.createLogger({
    level: process.env.LOG_LEVEL || "debug",
    format: winston.format.json({}),
    defaultMeta: {
      labels: {
        module: "explorer-indexer",
        version: process.env.VERSION,
        domainID: domainID,
      },
    },
    transports: transportsConfig,
  });
}
