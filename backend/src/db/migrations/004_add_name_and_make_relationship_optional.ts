import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("condolences", (table) => {
    table.string("name").notNullable().defaultTo("");
  });

  await knex("condolences").update({
    name: knex.raw("COALESCE(NULLIF(relationship, ''), ?)", ["未具名"]),
  });

  await knex.schema.alterTable("condolences", (table) => {
    table.string("relationship").nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex("condolences")
    .whereNull("relationship")
    .update({ relationship: "" });

  await knex.schema.alterTable("condolences", (table) => {
    table.string("relationship").notNullable().alter();
    table.dropColumn("name");
  });
}
