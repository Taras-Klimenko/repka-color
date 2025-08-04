import { Request, Response } from "express";
import { ColoringBookService } from "../services/coloringBook.service";
import formatResponse from "../utils/formatResponse";

export class ColoringBookController {
  static async getAllBooks(req: Request, res: Response) {
    try {
      const books = await ColoringBookService.getAllBooks();
      res
        .status(200)
        .json(formatResponse(200, "Books fetched successfully", books, null));
      return;
    } catch (error) {
      res
        .status(500)
        .json(
          formatResponse(500, "Server error while fetching books", null, error)
        );
      return;
    }
  }

  static async getBookById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const book = await ColoringBookService.getBookById(Number(id));

      if (!book) {
        res.status(404).json(formatResponse(404, "Book not found", null));
        return;
      }

      res
        .status(200)
        .json(formatResponse(200, "Book fetched successfully", book, null));
      return;
    } catch (error) {
      res
        .status(500)
        .json(
          formatResponse(500, "Server error while fetching book", null, error)
        );
      return;
    }
  }

  static async getBookPages(req: Request, res: Response) {
    try {
      const { bookId } = req.params;
      const pages = await ColoringBookService.getBookPages(Number(bookId));

      res
        .status(200)
        .json(formatResponse(200, "Pages fetched successfully", pages, null));

      return;
    } catch (error) {
      res
        .status(500)
        .json(
          formatResponse(
            500,
            "Server error while fetching pages data",
            null,
            error
          )
        );
      return;
    }
  }

  static async getPageById(req: Request, res: Response) {
    try {
      const { pageId } = req.params;

      const page = await ColoringBookService.getPageById(Number(pageId));

      if (!page) {
        res
          .status(404)
          .json(formatResponse(404, "Coloring book page not found", null));
        return;
      }

      res
        .status(200)
        .json(
          formatResponse(
            200,
            "Coloring book page fetched successfully",
            page,
            null
          )
        );

      return;
    } catch (error) {
      res
        .status(500)
        .json(
          formatResponse(
            500,
            "Server error while fetching page data",
            null,
            error
          )
        );
      return;
    }
  }

  static async getPageByBookAndOrder(req: Request, res: Response) {
    try {
      const { bookId, orderIndex } = req.params;

      const page = await ColoringBookService.getPageByBookAndOrder(
        Number(bookId),
        Number(orderIndex)
      );

      if (!page) {
        res
          .status(404)
          .json(formatResponse(404, "Coloring book page not found", null));
        return;
      }

      res
        .status(200)
        .json(
          formatResponse(
            200,
            "Coloring book page fetched successfully",
            page,
            null
          )
        );
      return;
    } catch (error) {
      res
        .status(500)
        .json(
          formatResponse(
            500,
            "Server error while fetching page data",
            null,
            error
          )
        );
      return;
    }
  }
}
