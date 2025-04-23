import express from 'express';
import { commentController } from '../controllers/commentController.js'; // Import controller cho xác thực
import { authController } from '../controllers/authController.js';

const router = express.Router();

router.delete('/deleteComment', authController.authenticateToken, commentController.deleteComment);
router.get('/getAllComments', authController.authenticateToken, commentController.getAllComments);

export { router };