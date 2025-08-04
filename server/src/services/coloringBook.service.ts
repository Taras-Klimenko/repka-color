import { prisma } from "./prisma";

export class ColoringBookService {
  static async getAllBooks() {
    const books = await prisma.coloringBook.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { pages: true },
        },
      },
    });

    return books.map((book) => ({ ...book, pageCount: book._count.pages }));
  }

  static async getBookById(id: number) {
    const book = await prisma.coloringBook.findUnique({
      where: { id },
      include: { _count: { select: { pages: true } } },
    });

    if (!book) {
      return null;
    }

    return { ...book, pageCount: book._count.pages };
  }

  static async getBookPages(bookId: number) {
    const pages = await prisma.coloringPage.findMany({
      where: { coloringBookId: bookId, isActive: true },
      orderBy: { orderIndex: "asc" },
    });

    return pages;
  }

  static async getPageById(pageId: number) {
    const page = await prisma.coloringPage.findUnique({
      where: { id: pageId },
      include: {
        coloringBook: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return page;
  }

  static async getPageByBookAndOrder(bookId: number, orderIndex: number) {
    const page = await prisma.coloringPage.findUnique({
      where: {
        coloringBookId_orderIndex: { coloringBookId: bookId, orderIndex },
      },
      include: {
        coloringBook: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return page;
  }
}
