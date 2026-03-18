import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import multer from "multer";
import dotenv from "dotenv";
import typeDefs from "./graphql/typeDefs";
import resolvers from "./graphql/resolvers";
import { verifyToken, AdminPayload } from "./middleware/auth";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "4000");
const MAX_UPLOAD_FILE_SIZE_MB = parseInt(
  process.env.PHOTO_MAX_FILE_SIZE_MB || "25",
  10
);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("僅接受圖片檔案"));
    }
  },
});

async function startServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();

  app.use(cors());

  app.post(
    "/graphql",
    upload.single("photo"),
    express.json(),
    (req: Request, _res: Response, next: NextFunction) => {
      if (req.body?.operations) {
        const ops = JSON.parse(req.body.operations);
        req.body = ops;
      }
      next();
    },
    expressMiddleware(server, {
      context: async ({ req }: { req: Request }) => {
        let admin: AdminPayload | null = null;
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith("Bearer ")) {
          try {
            admin = verifyToken(authHeader.substring(7));
          } catch {
            // invalid token, admin stays null
          }
        }

        return {
          admin,
          file: req.file
            ? {
                buffer: req.file.buffer,
                mimetype: req.file.mimetype,
                originalname: req.file.originalname,
              }
            : null,
        };
      },
    })
  );

  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(413)
        .json({ error: `照片檔案過大，請壓縮至 ${MAX_UPLOAD_FILE_SIZE_MB}MB 以下` });
    }
    next(err);
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}/graphql`);
  });
}

startServer().catch(console.error);
