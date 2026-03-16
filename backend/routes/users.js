const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { authenticate } = require('../middleware/auth');
const { generateToken } = require('../utils/auth');
const {
  deleteProfileImage,
  saveProfileImageFromDataUrl,
  serializeUser,
} = require('../utils/profileImage');

// PUT /api/users/profile - update user profile (protected route)
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { firstName, lastName, profileImage, removeProfileImage } = req.body;
    const userId = req.user.userId;

    // validation: check required fields
    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'First name and last name are required',
      });
    }

    // validation: trim and check length
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();

    if (trimmedFirst.length < 1 || trimmedFirst.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'First name must be between 1 and 50 characters',
      });
    }

    if (trimmedLast.length < 1 || trimmedLast.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Last name must be between 1 and 50 characters',
      });
    }

    // update user profile
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.firstName = trimmedFirst;
    user.lastName = trimmedLast;

    if (removeProfileImage) {
      await deleteProfileImage(user.profileImagePath);
      user.profileImagePath = null;
    }

    if (profileImage) {
      const previousImagePath = user.profileImagePath;
      const nextImagePath = await saveProfileImageFromDataUrl(profileImage);
      user.profileImagePath = nextImagePath;

      if (previousImagePath && previousImagePath !== nextImagePath) {
        await deleteProfileImage(previousImagePath);
      }
    }

    await user.save();

    // generate new JWT token with updated user info
    const token = generateToken({
      userId: user._id,
      email: user.email,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      token: token,
      user: serializeUser(req, user),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
    });
  }
});

// GET /api/users/search - search users by email (protected route)
// used for adding participants to rooms
router.get('/search', authenticate, async (req, res) => {
  try {
    const { q } = req.query;

    // validation: check query parameter
    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    // search for users by email (case insensitive, partial match)
    const users = await User.find({
      email: { $regex: q, $options: 'i' },
    })
      .select('firstName lastName email')
      .limit(10); // limit results to prevent large responses

    res.status(200).json({
      success: true,
      users: users.map((user) => ({
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      })),
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching users',
    });
  }
});

module.exports = router;
