import { Request, Response } from "express";
import { UserProgressService } from "../services/userProgress.service";
import formatResponse from "../utils/formatResponse";

export class UserProgressController {
  static async getUserPageProgress(req: Request, res: Response) {
    try {
      const { userId, coloringPageId } = req.params;

      const progress = await UserProgressService.getUserPageProgress(
        Number(userId),
        Number(coloringPageId)
      );

      if (!progress) {
        res
          .status(404)
          .json(formatResponse(404, "User progress for page not found", null));
        return;
      }

      res
        .status(200)
        .json(
          formatResponse(200, "User progress for page found", progress, null)
        );
      return;
    } catch (error) {
      res
        .status(500)
        .json(
          formatResponse(
            500,
            "Server error while fetching page progress",
            null,
            error
          )
        );
      return;
    }
  }

  static async getAllUserPageProgress(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const progress = await UserProgressService.getAllUserPageProgress(
        Number(userId)
      );

      res
        .status(200)
        .json(
          formatResponse(
            200,
            "All user page progress fetched successfully",
            progress,
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
            "Server error while fetching all user page progress",
            null,
            error
          )
        );
      return;
    }
  }

  static async getUserProgressByBookId(req: Request, res: Response) {
    try {
      const { userId, bookId } = req.params;

      const progress = await UserProgressService.getUserProgressByBookId(
        Number(userId),
        Number(bookId)
      );

      res
        .status(200)
        .json(
          formatResponse(
            200,
            "User progress by book id fetched successfully",
            progress,
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
            "Server error while fetching user progress by book id",
            null,
            error
          )
        );
      return;
    }
  }

  static async updateUserPageProgress(req: Request, res: Response) {
    try {
      const { userId, coloringPageId } = req.params;
      const { progressPercentage, currentColors } = req.body;

      if (
        progressPercentage === undefined ||
        progressPercentage === null ||
        progressPercentage < 0 ||
        progressPercentage > 100
      ) {
        res
          .status(400)
          .json(formatResponse(400, "Invalid progress data", null));
        return;
      }

      const progress = await UserProgressService.updateUserPageProgress(
        Number(userId),
        Number(coloringPageId),
        { progressPercentage, currentColors }
      );

      res
        .status(200)
        .json(
          formatResponse(
            200,
            "User page progress updated successfully",
            progress,
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
            "Server error while updating user page progress",
            null,
            error
          )
        );
      return;
    }
  }

  static async getUserBookCompletionSummary(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const completionSummary =
        await UserProgressService.getUserBookCompletionSummary(Number(userId));

      res
        .status(200)
        .json(
          formatResponse(
            200,
            "User book completion summary fetched",
            completionSummary,
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
            "Server error while fetching user book completion summary",
            null,
            error
          )
        );
      return;
    }
  }

  static async getCompletedPages(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const completedPages = await UserProgressService.getCompletedPages(
        Number(userId)
      );

      res
        .status(200)
        .json(
          formatResponse(
            200,
            "Completed pages fetched successfully",
            completedPages,
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
            "Server error while fetching completed pages",
            null,
            error
          )
        );
      return;
    }
  }
}
