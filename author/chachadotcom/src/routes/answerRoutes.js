const express = require('express');
const router = express.Router();
const answerController = require('../controllers/answerController');
const agauth = require('../middleware/agauth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    file.originalname = Buffer.from(file.originalname, "latin1").toString("utf-8");
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });

router.get('/:uuid', answerController.getAnswerByUuid);
router.post('/', agauth, answerController.createAnswer);
router.get('/image/:filename', answerController.uploadImage);
router.put('/:uuid', agauth, upload.single('image'), answerController.updateAnswer);
router.delete('/:uuid', agauth, answerController.deleteAnswer);

module.exports = router; 