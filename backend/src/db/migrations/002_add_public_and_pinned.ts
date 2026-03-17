import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("condolences", (table) => {
    table.boolean("is_public").notNullable().defaultTo(false);
    table.boolean("is_pinned").notNullable().defaultTo(false);
    table.timestamp("pinned_at").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("condolences", (table) => {
    table.dropColumn("is_public");
    table.dropColumn("is_pinned");
    table.dropColumn("pinned_at");
  });
}
