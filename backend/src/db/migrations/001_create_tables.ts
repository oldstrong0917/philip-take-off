import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("admin_users", (table) => {
    table.increments("id").primary();
    table.string("username").unique().notNullable();
    table.string("password_hash").notNullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable("condolences", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.string("relationship").notNullable();
    table.text("how_met").notNullable();
    table.text("message").notNullable();
    table.string("photo_url").notNullable();
    table.integer("photo_width").notNullable();
    table.integer("photo_height").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("condolences");
  await knex.schema.dropTableIfExists("admin_users");
}
