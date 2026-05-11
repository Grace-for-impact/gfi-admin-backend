import express from 'express';
import {
  login,
  refresh,
  forgotPassword,
  resetPassword,
} from '../controllers/authController';

const router = express.Router();

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

export default router;
