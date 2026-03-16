const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');
const { authenticate } = require('../middleware/auth');
const { serializeUser } = require('../utils/profileImage');

// POST /api/auth/register - register a new user account
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // validation: check required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: email, password, firstName, lastName',
      });
    }

    // validation: ensure inputs are strings (prevent NoSQL injection)
    if (typeof email !== 'string' || typeof password !== 'string' ||
        typeof firstName !== 'string' || typeof lastName !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid input types',
      });
    }

    // validation: check password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
    }

    // check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // hash the password
    const hashedPassword = await hashPassword(password);

    // create new user
    const newUser = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
    });

    await newUser.save();

    // generate JWT token
    const token = generateToken({
      userId: newUser._id,
      email: newUser.email,
    });

    // set HTTP-only cookie
    res.cookie('jwt', token, {
      httpOnly: true, // prevents JavaScript access (XSS protection)
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax', // CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // return success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: serializeUser(req, newUser),
      token, // also return token for client-side storage if needed
    });
  } catch (error) {
    console.error('Registration error:', error);

    // handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration',
    });
  }
});

// POST /api/auth/login - authenticate user and return JWT token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // validation: check required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // validation: ensure email is a string (prevent NoSQL injection)
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // find user by email (explicitly include password field)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // compare passwords
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    // generate JWT token
    const token = generateToken({
      userId: user._id,
      email: user.email,
    });

    // set HTTP-only cookie
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // return success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: serializeUser(req, user),
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
});

// POST /api/auth/logout - clear JWT cookie to log user out
router.post('/logout', (req, res) => {
  try {
    // clear the JWT cookie
    res.cookie('jwt', '', {
      httpOnly: true,
      expires: new Date(0), // set to past date to delete cookie
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during logout',
    });
  }
});

// GET /api/auth/me - get current authenticated user's information (protected route)
router.get('/me', authenticate, async (req, res) => {
  try {
    // req.user is set by authenticate middleware
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user: serializeUser(req, user),
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user information',
    });
  }
});

module.exports = router;
