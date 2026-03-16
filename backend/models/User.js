const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // don't return password by default in queries
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [1, 'First name must be at least 1 character'],
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [1, 'Last name must be at least 1 character'],
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    profileImagePath: {
      type: String,
      default: null,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // automatically adds createdAt and updatedAt fields
  }
);

// makes login faster
userSchema.index({ email: 1 });

// convenient way to get someone's full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// make sure we never accidentally send passwords to the client
userSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.password;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
