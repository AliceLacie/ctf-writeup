const Question = require('../models/Question');
const User = require('../models/User');

exports.getQuestions = async (req, res) => {
  try {
    const questions = await Question.find()
      .select('text user createdAt category status')
      .sort({ createdAt: -1 })
    res.json(questions);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id).select('text user createdAt category status')
    
    if (!question) {
      return res.status(404).json({ msg: 'Question not found' });
    }

    res.json(question);

  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Question not found' });
    }
    res.status(500).send('Server Error');
  }
};

exports.createQuestion = async (req, res) => {
  const { text, category } = req.body;

  try {
    const newQuestion = new Question({
      text,
      category,
      user: req.user.id
    });

    const question = await newQuestion.save();
    
    res.json({'msg': 'Question created'});
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ msg: 'Question not found' });
    }

    if (question.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await Question.findByIdAndRemove(req.params.id);

    res.json({ msg: 'Question removed' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.getPendingQuestions = async (req, res) => {
  try {
    if (req.user.role !== 'guide' && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const questions = await Question.find({ status: 'pending' })
      .select('text user createdAt category status')
      .sort({ createdAt: 1 })
    res.json(questions);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.getMyQuestions = async (req, res) => {
  try {
    const questions = await Question.find({ user: req.user.id })
      .select('text user createdAt category status')
      .sort({ createdAt: -1 })
    res.json(questions);
  } catch (err) {
    res.status(500).send('Server Error');
  }
}; 