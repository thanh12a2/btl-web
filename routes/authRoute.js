import express from 'express';
import { authController } from '../controllers/authController.js'; // Import controller cho xác thực

const router = express.Router();

router.post('/login', authController.login); // Đăng nhập

router.post('/register', authController.register); // Đăng ký tài khoản

router.get('/logout', authController.logout); // Đăng xuất tài khoản   

router.get('/sendotp', authController.authenticateToken, authController.sendOTP);

router.put("/updatePwd", authController.authenticateToken, authController.resetPassword);

router.put("/changeUsername", authController.authenticateToken, authController.changeUsername);

router.put("/changePwdQuanTri", authController.authenticateToken, authController.changePwdQuanTri);

export { router };