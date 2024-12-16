/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import nodeCleanup from "node-cleanup";

import { getLogger } from "../utils/logger";

import { App } from "./App";

App.init()
  .then(async (app) => {
    nodeCleanup(function (exitCode, signal) {
      app
        .stop(signal as string)
        .then(() => {
          nodeCleanup.uninstall();
        })
        .catch((error) => {
          getLogger().error("Error occurred while stopping the app", error);
          process.exit(1);
        });
    });
    await app.start();
  })
  .catch((error) =>
    getLogger().error("Error occurred while initializing the app", error),
  );
