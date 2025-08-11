import { Router } from "express";
import { UserProgressController } from "../controllers/userProgress.controller";

const router = Router();

router.get("/:userId", UserProgressController.getAllUserPageProgress);
router.get(
  "/summary/:userId",
  UserProgressController.getUserBookCompletionSummary
);
router.get(
  "/:userId/:coloringPageId",
  UserProgressController.getUserPageProgress
);
router.get(
  "/:userId/book/:bookId",
  UserProgressController.getUserProgressByBookId
);
router.patch(
  "/:userId/:coloringPageId",
  UserProgressController.updateUserPageProgress
);

export { router as userProgressRouter };
