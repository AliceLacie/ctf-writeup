const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const crypto = require('crypto');

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
};

exports.createUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    if (email.startsWith('guide_')) {
      return res.status(400).json({ msg: 'Invalid input' });
    }

    let user = await User.findOne({email: new RegExp(['^', String(email), '$'].join(''), 'i')});
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ msg: 'Username already taken' });
    }

    user = new User({
      username,
      email,
      password,
      role: 'user'
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();
    
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      config.jwtSecret,
      { expiresIn: '1d' },
      (err, token) => {
        if (err) throw err;
        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24*60*60*1000
        });
        res.json({ user: { id: user.id, username: user.username, email: user.email, role: user.role } });
      }
    );
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email: String(email) });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      config.jwtSecret,
      { expiresIn: '1d' },
      (err, token) => {
        if (err) throw err;
        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24*60*60*1000
        });
        res.json({ user: { id: user.id, username: user.username, email: user.email, role: user.role } });
      }
    );
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, change, token, password, sendMail } = req.body;
    let result;
    if (email && !change){
      result = await generateTokenSendMail(email, sendMail);
    /* } else if (email && change) {
            result = await changePassword(email, password); */
    } else if (token){
      result = await sendResetPassword(token, password);
    } else {
      return res.status(400).json({ msg: 'Invalid request' });
    }
    if (result.status){
      return res.status(res.status).json(result)
    }
    return res.status(200).json({msg: 'success'})
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

async function generateTokenSendMail(email, sendMail = true){
  const resetPassToken = crypto.randomBytes(26).toString('hex');
  const user           = await User.findOneAndUpdate({email: String(email)}, {resetPassToken}, {new: true});
  if (!user) {
      return {message: email};
  }
  if (sendMail) {
      // TODO .. 
      // await sendResetPassword(email, resetPassToken);
  }
  return {message: email};
}

async function sendResetPassword(token, password){
  const user = await User.findOne({resetPassToken: token});
  if (password === undefined) {
    if (user) {
      return {message: 'Token valide'};
    }
    return {message: 'Token invalide'};
  }

  if (user) {
    try {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();
      await User.updateOne({_id: user._id}, {$unset: {resetPassToken: 1}});
      return {message: 'Password reset successfully.'};
    } catch (err) {
      throw err;
    }
  }
  return {message: 'User not found, impossible to reset password.', status: 500};
}

exports.logout = async (req, res) => {
  res.cookie('token', {})
  res.json({ message: 'Logged out successfully' });
}