import bcrypt from "bcryptjs";
import db from "../db/connection";

async function main() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";

  if (!password || password.length < 8) {
    throw new Error("管理員密碼至少需要 8 個字元");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await db("admin_users").where({ username }).first();

  if (existing) {
    await db("admin_users")
      .where({ username })
      .update({ password_hash: passwordHash, updated_at: new Date() });
    console.log(`Updated admin password for user "${username}"`);
  } else {
    await db("admin_users").insert({
      username,
      password_hash: passwordHash,
      created_at: new Date(),
      updated_at: new Date(),
    });
    console.log(`Created admin user "${username}"`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.destroy();
  });
