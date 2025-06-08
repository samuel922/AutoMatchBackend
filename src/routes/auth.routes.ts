import express from 'express';
import authController from '../controllers/auth.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/verify-email', authController.verifyEmail);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes example
// router.get('/profile', authMiddleware.authenticate(), (req, res) => {
//   res.json({ user: req.user });
// });

export default router;