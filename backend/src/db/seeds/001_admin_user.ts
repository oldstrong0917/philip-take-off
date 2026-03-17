import { Knex } from "knex";
import bcrypt from "bcryptjs";

export async function seed(knex: Knex): Promise<void> {
  const existing = await knex("admin_users").where({ username: "admin" }).first();
  if (existing) return;

  const passwordHash = await bcrypt.hash("admin123", 10);
  await knex("admin_users").insert({
    username: "admin",
    password_hash: passwordHash,
  });
}
