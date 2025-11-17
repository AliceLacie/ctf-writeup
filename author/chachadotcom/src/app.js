const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const connectDB = require('./config/db');
const config = require('./config/config');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');

const userRoutes = require('./routes/userRoutes');
const questionRoutes = require('./routes/questionRoutes');
const answerRoutes = require('./routes/answerRoutes');
const authRoutes = require('./routes/authRoutes');
const User = require('./models/User');

const app = express();

connectDB();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/index.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/profile.html'));
});

app.get('/my-questions', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/my-questions.html'));
});

app.get('/question/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/question-detail.html'));
});

app.use('/', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/answers', answerRoutes);

const PORT = config.port;

const hashingPW = async (password) => {
  const salt = await bcrypt.genSalt(10)
  const hashedPw = await bcrypt.hash(password, salt)
  return hashedPw
}

async function initMongo() {
  const existingGuide = await User.findOne({ username: 'admin', role: 'guide' });
  if (!existingGuide) {
    const guide_email = `guide_<REDACTED(^[a-z0-9]{11}$)>@admin.com`;
    const guide_password = Math.random().toString(36).substring(2, 15);
    const hash = await hashingPW(guide_password);
    await User.create({
      username: 'admin',
      email: guide_email,
      password: hash,
      role: 'guide',
      avatar: '',
      bio: 'I am a guide'
    });
    console.log(`Guide account created: ${guide_email}`);
    console.log(`Guide password: ${guide_password}`);
  }
}

initMongo().then(() => {
  app.listen(PORT, () => {
    console.log(`ChaCha server running on port ${PORT}`);
  });
}); 