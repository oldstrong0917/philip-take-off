import type { Knex } from "knex";
import dotenv from "dotenv";

dotenv.config();

const isDistBuild = __dirname.includes("/dist/");
const migrationExtension = isDistBuild ? "js" : "ts";

const config: Knex.Config = {
  client: "pg",
  connection: process.env.DATABASE_URL,
  migrations: {
    directory: "./migrations",
    extension: migrationExtension,
    loadExtensions: [`.${migrationExtension}`],
  },
  seeds: {
    directory: "./seeds",
    extension: migrationExtension,
    loadExtensions: [`.${migrationExtension}`],
  },
};

export default config;
