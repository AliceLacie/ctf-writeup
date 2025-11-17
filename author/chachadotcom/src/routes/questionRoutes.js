const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const auth = require('../middleware/auth');

router.get('/', questionController.getQuestions);
router.get('/pending', auth, questionController.getPendingQuestions);
router.get('/me', auth, questionController.getMyQuestions);
router.get('/:id', questionController.getQuestionById);
router.post('/', auth, questionController.createQuestion);
router.delete('/:id', auth, questionController.deleteQuestion);

module.exports = router; 