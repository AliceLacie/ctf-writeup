const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const agauth = require('../middleware/agauth');

router.get('/', agauth, userController.getUsers);
router.get('/logout', userController.logout);
router.get('/:id', agauth, userController.getUserById);
router.post('/', userController.createUser);

module.exports = router; 