const express = require('express');
const router = express.Router();
const path = require('path');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/login', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../../views/login.html'));
});

router.get('/register', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../../views/register.html'));
});

router.get('/reset', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../../views/reset.html'));
});


router.post('/api/auth/login', userController.loginUser);
router.post('/api/auth/register', userController.createUser);
router.get('/api/auth/user', auth, userController.getCurrentUser);
router.post('/api/auth/reset', userController.resetPassword);

module.exports = router; 