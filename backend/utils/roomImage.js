const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'room-images');
const UPLOAD_ROUTE_PREFIX = '/uploads/room-images/';
const MAX_ROOM_IMAGE_BYTES = 2 * 1024 * 1024;

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

  return {
    mimeType: matches[1],
    buffer: Buffer.from(matches[2], 'base64'),
  };
}

async function saveRoomImageFromDataUrl(dataUrl) {
  const parsed = parseDataUrl(dataUrl);

  if (!parsed) {
    const error = new Error('Room image must be a valid JPG, PNG, WEBP, or GIF file');
    error.statusCode = 400;
    throw error;
  }

  if (parsed.buffer.length > MAX_ROOM_IMAGE_BYTES) {
    const error = new Error('Room image must be 2MB or smaller');
    error.statusCode = 400;
    throw error;
  }

  const filename = `${crypto.randomUUID()}.${MIME_EXTENSION_MAP[parsed.mimeType]}`;
  await ensureUploadDir();
  await fs.writeFile(path.join(UPLOAD_DIR, filename), parsed.buffer);

  return `${UPLOAD_ROUTE_PREFIX}${filename}`;
}

async function deleteRoomImage(imagePath) {
  if (!imagePath || typeof imagePath !== 'string' || !imagePath.startsWith(UPLOAD_ROUTE_PREFIX)) {
    return;
  }

  const filename = imagePath.slice(UPLOAD_ROUTE_PREFIX.length);
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

function getRoomImageUrl(req, imagePath) {
  if (!imagePath) {
    return null;
  }

  return `${req.protocol}://${req.get('host')}${imagePath}`;
}

module.exports = {
  deleteRoomImage,
  getRoomImageUrl,
  saveRoomImageFromDataUrl,
};
