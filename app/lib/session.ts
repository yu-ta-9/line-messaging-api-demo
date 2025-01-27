import {
  type Cookie,
  type CookieOptions,
  createSessionStorage,
} from "@remix-run/node";
import { prisma } from "~/lib/prisma";

type StoreGeneratorArg = {
  cookie: Cookie | CookieOptions;
};

type SessionData = {
  userId: number | null;
};

type SessionFlashData = {
  error: string;
};

function createDatabaseSessionStorage({ cookie }: StoreGeneratorArg) {
  return createSessionStorage<SessionData, SessionFlashData>({
    cookie,
    async createData(data, expires) {
      if (!data.userId || !expires) {
        throw new Error("No userId or expires");
      }

      const { id } = await prisma.session.create({
        data: {
          userId: data.userId,
          expiresAt: expires,
        },
      });
      return id;
    },
    async readData(id) {
      return (await prisma.session.findUnique({ where: { id } })) || null;
    },
    async updateData(id, data, expires) {
      await prisma.session.update({
        where: { id },
        data: {
          userId: Number(data.userId),
          expiresAt: expires,
        },
      });
    },
    async deleteData(id) {
      await prisma.session.delete({
        where: { id },
      });
    },
  });
}

const { getSession, commitSession, destroySession } =
  createDatabaseSessionStorage({
    cookie: {
      name: "__session",
      sameSite: "lax",
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day
    },
  });

export { getSession, commitSession, destroySession };
