import bcrypt from "bcryptjs";
import db from "../db/connection";
import { generateToken, getAdminFromContext, AdminPayload } from "../middleware/auth";
import { uploadToS3, deleteFromS3, getSignedDownloadUrl } from "../utils/s3";
import { validateImageDimensions } from "../utils/imageValidator";
import dotenv from "dotenv";

dotenv.config();

interface Context {
  admin?: AdminPayload | null;
  file?: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
  } | null;
}

const resolvers = {
  Condolence: {
    photoUrl: async (parent: Record<string, unknown>) => {
      const rawUrl = parent.photoUrl as string;
      if (!rawUrl) return rawUrl;
      try {
        return await getSignedDownloadUrl(rawUrl);
      } catch {
        return rawUrl;
      }
    },
  },

  Query: {
    condolences: async (
      _: unknown,
      { limit, offset }: { limit?: number; offset?: number }
    ) => {
      const query = db("condolences")
        .orderBy("is_pinned", "desc")
        .orderByRaw("CASE WHEN is_pinned = true THEN pinned_at END ASC")
        .orderBy("created_at", "desc");
      if (limit) query.limit(limit);
      if (offset) query.offset(offset);
      const rows = await query;
      return rows.map(mapCondolence);
    },

    condolence: async (_: unknown, { id }: { id: string }) => {
      const row = await db("condolences").where({ id }).first();
      if (!row) throw new Error("找不到該筆弔唁資料");
      return mapCondolence(row);
    },

    photos: async () => {
      const rows = await db("condolences")
        .select("id", "photo_url", "photo_width", "photo_height", "relationship", "how_met", "message", "is_public", "is_pinned", "pinned_at", "created_at")
        .where("is_public", true)
        .orderBy("is_pinned", "desc")
        .orderByRaw("CASE WHEN is_pinned = true THEN pinned_at END ASC")
        .orderBy("created_at", "desc");
      return rows.map(mapCondolence);
    },

    photoLimits: () => ({
      minWidth: parseInt(process.env.PHOTO_MIN_WIDTH || "800"),
      minHeight: parseInt(process.env.PHOTO_MIN_HEIGHT || "600"),
      maxWidth: parseInt(process.env.PHOTO_MAX_WIDTH || "4096"),
      maxHeight: parseInt(process.env.PHOTO_MAX_HEIGHT || "4096"),
    }),
  },

  Mutation: {
    createCondolence: async (
      _: unknown,
      args: { relationship: string; howMet: string; message: string; isPublic: boolean },
      context: Context
    ) => {
      if (!context.file) {
        throw new Error("請上傳一張照片");
      }

      const { buffer, mimetype, originalname } = context.file;
      const { width, height } = await validateImageDimensions(buffer);
      const photoUrl = await uploadToS3(buffer, mimetype, originalname);

      const [row] = await db("condolences")
        .insert({
          relationship: args.relationship,
          how_met: args.howMet,
          message: args.message,
          photo_url: photoUrl,
          photo_width: width,
          photo_height: height,
          is_public: args.isPublic,
        })
        .returning("*");

      return mapCondolence(row);
    },

    adminLogin: async (
      _: unknown,
      { username, password }: { username: string; password: string }
    ) => {
      const admin = await db("admin_users").where({ username }).first();
      if (!admin) throw new Error("帳號或密碼錯誤");

      const valid = await bcrypt.compare(password, admin.password_hash);
      if (!valid) throw new Error("帳號或密碼錯誤");

      const token = generateToken({ id: admin.id, username: admin.username });
      return {
        token,
        admin: { id: admin.id, username: admin.username },
      };
    },

    updateCondolence: async (
      _: unknown,
      args: { id: string; relationship?: string; howMet?: string; message?: string },
      context: Context
    ) => {
      getAdminFromContext(context);

      const updates: Record<string, string> = {};
      if (args.relationship !== undefined) updates.relationship = args.relationship;
      if (args.howMet !== undefined) updates.how_met = args.howMet;
      if (args.message !== undefined) updates.message = args.message;

      if (Object.keys(updates).length === 0) {
        throw new Error("請提供至少一個要修改的欄位");
      }

      const [row] = await db("condolences")
        .where({ id: args.id })
        .update(updates)
        .returning("*");

      if (!row) throw new Error("找不到該筆弔唁資料");
      return mapCondolence(row);
    },

    togglePinCondolence: async (
      _: unknown,
      { id }: { id: string },
      context: Context
    ) => {
      getAdminFromContext(context);

      const existing = await db("condolences").where({ id }).first();
      if (!existing) throw new Error("找不到該筆弔唁資料");

      const nowPinned = !existing.is_pinned;
      const [row] = await db("condolences")
        .where({ id })
        .update({
          is_pinned: nowPinned,
          pinned_at: nowPinned ? new Date() : null,
        })
        .returning("*");

      return mapCondolence(row);
    },

    deleteCondolence: async (
      _: unknown,
      { id }: { id: string },
      context: Context
    ) => {
      getAdminFromContext(context);

      const row = await db("condolences").where({ id }).first();
      if (!row) throw new Error("找不到該筆弔唁資料");

      try {
        await deleteFromS3(row.photo_url);
      } catch {
        // S3 deletion failure should not block DB deletion
      }

      await db("condolences").where({ id }).delete();
      return { success: true, deletedCount: 1 };
    },

    batchDeleteCondolences: async (
      _: unknown,
      { ids }: { ids: string[] },
      context: Context
    ) => {
      getAdminFromContext(context);

      const rows = await db("condolences").whereIn("id", ids);
      for (const row of rows) {
        try {
          await deleteFromS3(row.photo_url);
        } catch {
          // continue with other deletions
        }
      }

      const deletedCount = await db("condolences").whereIn("id", ids).delete();
      return { success: true, deletedCount };
    },

    batchDownloadPhotos: async (
      _: unknown,
      { ids }: { ids: string[] },
      context: Context
    ) => {
      getAdminFromContext(context);

      const rows = await db("condolences").whereIn("id", ids);
      const urls = await Promise.all(
        rows.map(async (row) => ({
          id: row.id,
          url: await getSignedDownloadUrl(row.photo_url),
        }))
      );

      return urls;
    },
  },
};

function mapCondolence(row: Record<string, unknown>) {
  return {
    id: row.id,
    relationship: row.relationship,
    howMet: row.how_met,
    message: row.message,
    photoUrl: row.photo_url,
    photoWidth: row.photo_width,
    photoHeight: row.photo_height,
    isPublic: row.is_public ?? false,
    isPinned: row.is_pinned ?? false,
    pinnedAt: row.pinned_at
      ? new Date(row.pinned_at as string).toISOString()
      : null,
    createdAt: row.created_at
      ? new Date(row.created_at as string).toISOString()
      : new Date().toISOString(),
  };
}

export default resolvers;
