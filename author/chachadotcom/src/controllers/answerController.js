const Answer = require('../models/Answer');
const Question = require('../models/Question');
const path = require('path');
const crypto = require('crypto');

exports.getAnswerByUuid = async (req, res) => {
  try {
    const uuid = req.params.uuid;

    if (typeof uuid !== 'string' || !/^[0-9a-f-]{36}$/i.test(uuid)) {
      return res.status(400).json({ msg: 'Invalid UUID format' });
    }

    const answer = await Answer.findOne({uuid: uuid})
      .populate('guide', 'username avatar')
      .populate('question');
    
    
    if (!answer) {
      return res.status(404).json({ msg: 'Answer not found' });
    }

    res.json(answer);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Answer not found' });
    }
    res.status(500).send('Server Error');
  }
};

exports.createAnswer = async (req, res) => {
  const { text, questionId } = req.body;
  try {
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ msg: 'Question not found' });
    }

    if (question.status === 'answered' || question.status === 'closed') {
      return res.status(400).json({ msg: 'This question has already been answered' });
    }

    const uuid = crypto.randomUUID();

    const newAnswer = new Answer({
      text,
      question: questionId,
      guide: req.user.id,
      uuid: uuid
    });

    const answer = await newAnswer.save();
    question.status = 'answered';
    question.assignedTo = req.user.id;
    question.updatedAt = Date.now();
    await question.save();
    
    res.json({uuid: uuid});
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.updateAnswer = async (req, res) => {
  const { text, rating } = req.body;

  const answerFields = {};
  if (text) answerFields.text = text;
  if (rating) answerFields.rating = rating;
  answerFields.updatedAt = Date.now();

  if (req.file) {
    answerFields.image = `/api/answers/image/${path.basename(req.file.filename)}`;
  }

  try {
    const uuid = req.params.uuid;
    if (typeof uuid !== 'string' || !/^[0-9a-f-]{36}$/i.test(uuid)) {
      return res.status(400).json({ msg: 'Invalid UUID format' });
    }

    let answer = await Answer.findOne({uuid: uuid});

    if (!answer) {
      return res.status(404).json({ msg: 'Answer not found' });
    }

    if (rating) {
      const question = await Question.findById(answer.question);
      if (question.user.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'Only the question owner can rate answers' });
      }
    }

    answer = await Answer.findOneAndUpdate(
      {uuid: uuid},
      { $set: answerFields },
      { new: true }
    ).populate('guide', 'username avatar');

    return res.json(answer);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.deleteAnswer = async (req, res) => {
  try {
    const uuid = req.params.uuid;
    if (typeof uuid !== 'string' || !/^[0-9a-f-]{36}$/i.test(uuid)) {
      return res.status(400).json({ msg: 'Invalid UUID format' });
    }
    const answer = await Answer.findOne({uuid: uuid});

    if (!answer) {
      return res.status(404).json({ msg: 'Answer not found' });
    }

    const question = await Question.findById(answer.question);
    if (question) {
      question.status = 'pending';
      question.assignedTo = null;
      question.updatedAt = Date.now();
      await question.save();
    }

    await Answer.findOneAndDelete({uuid: uuid});

    res.json({ msg: 'Answer removed' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
}; 

exports.uploadImage = async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', path.basename(filename));
  if (!filename) {
    return res.status(400).json({ msg: 'No image file uploaded' });
  }
  res.sendFile(filePath);

};