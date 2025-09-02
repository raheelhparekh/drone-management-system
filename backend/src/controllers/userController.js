import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';

// Utility function to generate a JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create new user
  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    // Set token as HttpOnly cookie
    const token = generateToken(user._id);
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email and select the password
  const user = await User.findOne({ email }).select('+password');

  if (user && (await user.matchPassword(password))) {
    // Set token as HttpOnly cookie
    const token = generateToken(user._id);
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0), // Set to a past date to expire the cookie
  });
  res.status(200).json({ message: 'Logged out successfully' });
});

export { registerUser, loginUser, logoutUser };
