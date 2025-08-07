import { prisma } from "./prisma";

export type ProgressUpdateData = {
  progressPercentage: number;
  currentColors?: any;
};

export class UserProgressService {
  static async getUserPageProgress(userId: number, coloringPageId: number) {
    const progress = await prisma.userPageProgress.findUnique({
      where: {
        userId_coloringPageId: { userId, coloringPageId },
      },
    });

    return progress;
  }

  static async getAllUserPageProgress(userId: number) {
    const progress = await prisma.userPageProgress.findMany({
      where: { userId },
      include: {
        coloringPage: {
          select: {
            id: true,
            title: true,
            orderIndex: true,
            coloringBook: { select: { id: true, title: true } },
          },
        },
      },
    });

    return progress;
  }

  static async getUserProgressByBookId(userId: number, bookId: number) {
    const progress = await prisma.userPageProgress.findMany({
      where: { userId, coloringPage: { coloringBookId: bookId } },
    });

    return progress;
  }

  static async updateUserPageProgress(
    userId: number,
    coloringPageId: number,
    data: ProgressUpdateData
  ) {
    const progress = await prisma.userPageProgress.upsert({
      where: {
        userId_coloringPageId: { userId, coloringPageId },
      },
      update: {
        progressPercentage: data.progressPercentage,
        currentColors: data.currentColors,
      },
      create: {
        userId,
        coloringPageId,
        progressPercentage: data.progressPercentage,
        currentColors: data.currentColors,
      },
    });

    return progress;
  }
}
