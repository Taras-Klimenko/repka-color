import { Router } from 'express';
import { ColoringBookController } from '../controllers/coloringBook.controller';

const router = Router();
// Books
router.get('/', ColoringBookController.getAllBooks);
router.get('/:id', ColoringBookController.getBookById)

// Pages
router.get('/:bookId/pages', ColoringBookController.getBookPages);
router.get('/pages/:pageId', ColoringBookController.getPageById);
router.get('/:bookId/pages/:orderIndex', ColoringBookController.getPageByBookAndOrder);


export { router as coloringBookRouter };