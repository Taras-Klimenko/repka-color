import { Router } from 'express';
import { ColoringBookController } from '../controllers/coloringBook.controller';

const router = Router();

router.get('/', ColoringBookController.getAllBooks);
router.get('/:id', ColoringBookController.getBookById)


export { router as coloringBookRouter };