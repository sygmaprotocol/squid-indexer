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

import { initDatabase } from "../utils";
import { logger } from "../utils/logger";

import { config as envPluginConfig } from "./config/env.config";
import { SWAGGER_CONFIG, SWAGGER_UI_CONFIG } from "./config/swagger.config";
import { routesPlugin } from "./services/plugins/routes";

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
    await instance.register(fastifyEnv, envPluginConfig);

    const app = new App(instance);

    await app.initDb();
    await app.registerPlugins();
    return app;
  }

  public async start(): Promise<void> {
    try {
      await this.instance.ready();
      logger.info(this.instance.printRoutes());
      await this.instance.listen({
        port: this.instance.config.SERVER_PORT,
        host: this.instance.config.SERVER_ADDRESS,
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
    await this.instance.register(fastifyCors, {
      origin: this.instance.config.CORS_ORIGIN,
    });
    await this.instance.register(fastifyCompress, {
      global: true,
      encodings: ["gzip", "deflate"],
    });
    await this.instance.register(fastifyHelmet);
    await this.instance.register(fastifySwagger, SWAGGER_CONFIG);
    await this.instance.register(fastifySwaggerUi, SWAGGER_UI_CONFIG);
    await this.instance.register(routesPlugin);
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
