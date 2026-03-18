import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("condolences", (table) => {
    table.string("photo_url").nullable().alter();
    table.integer("photo_width").nullable().alter();
    table.integer("photo_height").nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex("condolences")
    .whereNull("photo_url")
    .update({
      photo_url: "",
      photo_width: 0,
      photo_height: 0,
    });

  await knex.schema.alterTable("condolences", (table) => {
    table.string("photo_url").notNullable().alter();
    table.integer("photo_width").notNullable().alter();
    table.integer("photo_height").notNullable().alter();
  });
}
