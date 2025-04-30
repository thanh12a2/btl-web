import express from 'express';
import { commentController } from '../controllers/commentController.js'; // Import controller cho xác thực
import { authController } from '../controllers/authController.js';
const app = express();

// Middleware để parse JSON
app.use(express.json());

// Middleware để parse dữ liệu URL-encoded
app.use(express.urlencoded({ extended: true }));

const router = express.Router();

router.delete('/deleteComment', authController.authenticateToken, commentController.deleteComment);
router.get('/getAllComments', authController.authenticateToken, commentController.getAllComments);

export { router };