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

  static async getUserBookCompletionSummary(userId: number) {
    const progress = await prisma.userPageProgress.findMany({
      where: { userId },
      include: {
        coloringPage: {
          select: {
            id: true,
            coloringBook: {
              select: {
                id: true,
                title: true,
                _count: { select: { pages: true } },
              },
            },
          },
        },
      },
    });

    const bookCompletionMap = new Map<
      number,
      {
        completedPages: number;
        totalPages: number;
        completionPercentage: number;
      }
    >();

    progress.forEach((page) => {
      const bookId = page.coloringPage.coloringBook.id;
      const totalPages = page.coloringPage.coloringBook._count.pages;

      if (!bookCompletionMap.has(bookId)) {
        bookCompletionMap.set(bookId, {
          completedPages: 0,
          totalPages,
          completionPercentage: 0,
        });
      }

      const bookData = bookCompletionMap.get(bookId);
      if (page.progressPercentage === 100) {
        bookData!.completedPages++;
      }
    });

    bookCompletionMap.forEach((bookData) => {
      bookData.completionPercentage =
        bookData.totalPages > 0
          ? Math.round((bookData.completedPages / bookData.totalPages) * 100)
          : 0;
    });

    return Array.from(bookCompletionMap.entries()).map(
      ([bookId, bookData]) => ({ bookId, ...bookData })
    );
  }

  static async getCompletedPages(userId: number) {
    const completedPages = await prisma.userPageProgress.findMany({
      where: { userId: userId, progressPercentage: 100 },
      include: {
        coloringPage: {
          include: {
            coloringBook: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
    return completedPages;
  }
}
