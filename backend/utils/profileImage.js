const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'profile-pictures');
const UPLOAD_ROUTE_PREFIX = '/uploads/profile-pictures/';
const MAX_PROFILE_IMAGE_BYTES = 2 * 1024 * 1024;

const MIME_EXTENSION_MAP = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

async function ensureUploadDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

function parseDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') {
    return null;
  }

  const matches = dataUrl.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/);
  if (!matches) {
    return null;
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');

  return { mimeType, buffer };
}

async function saveProfileImageFromDataUrl(dataUrl) {
  const parsed = parseDataUrl(dataUrl);

  if (!parsed) {
    const error = new Error('Profile image must be a valid JPG, PNG, WEBP, or GIF file');
    error.statusCode = 400;
    throw error;
  }

  if (parsed.buffer.length > MAX_PROFILE_IMAGE_BYTES) {
    const error = new Error('Profile image must be 2MB or smaller');
    error.statusCode = 400;
    throw error;
  }

  const extension = MIME_EXTENSION_MAP[parsed.mimeType];
  const filename = `${crypto.randomUUID()}.${extension}`;

  await ensureUploadDir();
  await fs.writeFile(path.join(UPLOAD_DIR, filename), parsed.buffer);

  return `${UPLOAD_ROUTE_PREFIX}${filename}`;
}

function getProfileImageUrl(req, profileImagePath) {
  if (!profileImagePath) {
    return null;
  }

  return `${req.protocol}://${req.get('host')}${profileImagePath}`;
}

async function deleteProfileImage(profileImagePath) {
  if (!profileImagePath || typeof profileImagePath !== 'string') {
    return;
  }

  if (!profileImagePath.startsWith(UPLOAD_ROUTE_PREFIX)) {
    return;
  }

  const filename = profileImagePath.slice(UPLOAD_ROUTE_PREFIX.length);
  if (!filename) {
    return;
  }

  try {
    await fs.unlink(path.join(UPLOAD_DIR, filename));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

function serializeUser(req, user) {
  return {
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
    profileImageUrl: getProfileImageUrl(req, user.profileImagePath),
  };
}

module.exports = {
  MAX_PROFILE_IMAGE_BYTES,
  deleteProfileImage,
  getProfileImageUrl,
  saveProfileImageFromDataUrl,
  serializeUser,
};
