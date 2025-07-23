import { prisma } from "./prisma";

export class ColoringBookService {

    static async getAllBooks() {
        const books = await prisma.coloringBook.findMany({where: {isActive: true}})
        return books;
    }

    static async getBookById(id: number) {
        const book = await prisma.coloringBook.findUnique({where: {id}})
        return book;
    }
};