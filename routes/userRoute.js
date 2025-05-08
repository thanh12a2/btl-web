import express from 'express';
import { userController } from '../controllers/userController.js';
import { authController } from '../controllers/authController.js';

const router = express.Router();

// API lấy danh sách người dùng - yêu cầu xác thực
router.get('/getAllUsers', authController.authenticateToken, userController.getAllUsers);

// API lấy thông tin chi tiết người dùng - yêu cầu xác thực
router.post('/getUserById', authController.authenticateToken, userController.getUserById);

// API thêm người dùng mới - yêu cầu xác thực
router.post('/addUser', authController.authenticateToken, userController.addUser);

// API cập nhật thông tin người dùng - yêu cầu xác thực
router.post('/updateUser', authController.authenticateToken, userController.updateUser);

// API xóa người dùng - yêu cầu xác thực
router.post('/deleteUser', authController.authenticateToken, userController.deleteUser);

export { router }; 