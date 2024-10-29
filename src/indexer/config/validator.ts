export type DbConfig = {
  host: string;
  name: string;
  port: number;
  username: string;
  password: string;
};

export type EnvVariables = {
  sharedConfigURL: string;
  rpcUrls: string;
  domainId: number;
  domainGateway: string;
  dbConfig: DbConfig;
  logLevel: string;
  version: string;
};
export function getEnv(): EnvVariables {
  const sharedConfigURL = process.env.SHARED_CONFIG_URL;
  if (!sharedConfigURL) {
    throw new Error(`SHARED_CONFIG_URL is not defined in the environment.`);
  }

  const rpcUrls = process.env.RPC_URL;
  if (!rpcUrls) {
    throw new Error(`RPC_URL environment variable is not defined.`);
  }

  const domainId = Number(process.env.DOMAIN_ID);
  if (isNaN(domainId)) {
    throw new Error(`DOMAIN_ID environment variable is invalid or not set.`);
  }

  const domainGateway = process.env.DOMAIN_GATEWAY || "";

  const dbHost = process.env.DB_HOST;
  if (!dbHost) {
    throw new Error(`DB_HOST is not defined in the environment.`);
  }

  const dbName = process.env.DB_NAME;
  if (!dbName) {
    throw new Error(`DB_NAME is not defined in the environment.`);
  }

  const dbPort = parseInt(process.env.DB_PORT || "");
  if (isNaN(dbPort)) {
    throw new Error(`DB_PORT environment variable is invalid or not set.`);
  }

  const dbUsername = process.env.DB_USERNAME;
  if (!dbUsername) {
    throw new Error(`DB_USERNAME is not defined in the environment.`);
  }

  const dbPassword = process.env.DB_PASS;
  if (!dbPassword) {
    throw new Error(`DB_PASS is not defined in the environment.`);
  }

  const logLevel = process.env.LOG_LEVEL || "debug";
  const version = process.env.VERSION || "unknown";

  return {
    sharedConfigURL,
    rpcUrls,
    domainId,
    domainGateway,
    dbConfig: {
      host: dbHost,
      name: dbName,
      port: dbPort,
      username: dbUsername,
      password: dbPassword,
    },
    logLevel,
    version,
  };
}