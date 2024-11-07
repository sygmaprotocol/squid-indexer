/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import fastifyCompress from "@fastify/compress";
import fastifyCors from "@fastify/cors";
import fastifyEnv from "@fastify/env";
import fastifyHelmet from "@fastify/helmet";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import type { FastifyInstance } from "fastify";
import fastify from "fastify";
import fastifyHealthCheck from "fastify-healthcheck";
import type { DataSource } from "typeorm";
import dbPlugin from "typeorm-fastify-plugin";

import { initDatabase } from "../utils";
import { logger } from "../utils/logger";

import { config as envPluginConfig } from "./config";
import { routesPlugin } from "./services/plugins/routes";
import { SWAGGER_CONFIG, SWAGGER_UI_CONFIG } from "./services/swagger";

export class App {
  public readonly instance: FastifyInstance;

  protected constructor(instance: FastifyInstance) {
    this.instance = instance;
  }

  public static async init(): Promise<App> {
    const instance = fastify({
      logger: true,
      return503OnClosing: true,
    });
    const app = new App(instance);
    await app.registerPlugins();
    return app;
  }

  public async start(): Promise<void> {
    try {
      await this.initDb();
      await this.instance.ready();
      logger.info(this.instance.printRoutes());
      return new Promise((resolve, reject) => {
        this.instance.listen(
          {
            port: this.instance.config.SERVER_PORT,
            host: this.instance.config.SERVER_ADDRESS,
          },
          (error) => {
            if (error) {
              logger.error("Failed to start server: ", error);
              reject();
            }
            resolve();
          },
        );
      });
    } catch (error) {
      logger.error("Error occurred during app startup: ", error);
      await this.stop(undefined);
    }
  }

  public async stop(signal: string | undefined): Promise<void> {
    await this.instance.db
      .destroy()
      .catch((error: Error) =>
        logger.error(
          `Error occurred during database closing because: ${error.message}`,
        ),
      );
    try {
      await this.instance.close();
    } catch (error) {
      logger.error("Error occurred during server closing: ", error);
    }

    if (signal !== "TEST") {
      process.kill(process.pid, signal);
    }
  }

  private async initDb(): Promise<void> {
    const dbSource = await initDatabase({
      host: this.instance.config.DB_HOST,
      name: this.instance.config.DB_NAME,
      password: this.instance.config.DB_PASS,
      port: this.instance.config.DB_PORT,
      username: this.instance.config.DB_USERNAME,
    });
    this.instance.decorate("db", dbSource);
  }

  private async registerPlugins(): Promise<void> {
    await this.instance.register(fastifyEnv, envPluginConfig);
    await this.instance.after();
    await this.instance.register(fastifyCompress, {
      global: true,
      encodings: ["gzip", "deflate"],
    });
    await this.instance.register(fastifyCors, {
      origin: this.instance.config.CORS_ORIGIN,
    });
    await this.instance.register(fastifyHelmet);
    await this.instance.register(fastifySwagger, SWAGGER_CONFIG);
    await this.instance.register(fastifySwaggerUi, SWAGGER_UI_CONFIG);
    await this.instance.register(routesPlugin);
    await this.instance.register(dbPlugin, { connection: this.instance.db });
    await this.instance.register(fastifyHealthCheck, {
      healthcheckUrl: "/health",
      exposeUptime: true,
      underPressureOptions: {
        healthCheckInterval: this.instance.config.HEALTHCHECK_INTERVAL,
        healthCheck: async () => {
          try {
            await this.instance.db.query("SELECT 1");
            return true;
          } catch (error) {
            logger.error(
              "Healthcheck: database connection check failed: ",
              error,
            );
            return false;
          }
        },
      },
    });
  }
}

declare module "fastify" {
  interface FastifyInstance {
    db: DataSource;
  }
}
