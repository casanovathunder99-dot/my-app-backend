const express = require('express');
const auth = require('../middleware/auth');
const Video = require('../models/Video');

const router = express.Router();

// Create video (upload handled separately)
router.post('/', auth, async (req, res, next) => {
  try {
    const { title, description, url, thumbnailUrl } = req.body;
    const video = new Video({ title, description, url, thumbnailUrl, user: req.user.id });
    await video.save();
    res.json(video);
  } catch (err) {
    next(err);
  }
});

// Get all videos (with basic pagination)
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const videos = await Video.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name avatarUrl');
    res.json(videos);
  } catch (err) {
    next(err);
  }
});

// Get single video
router.get('/:id', async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id).populate('user', 'name avatarUrl');
    if (!video) return res.status(404).json({ msg: 'Video not found' });
    res.json(video);
  } catch (err) {
    next(err);
  }
});

// Like/unlike video (toggle)
router.post('/:id/like', auth, async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ msg: 'Video not found' });

    const userId = req.user.id;
    const likedIndex = video.likes.findIndex(id => id.toString() === userId);
    if (likedIndex === -1) {
      video.likes.push(userId);
    } else {
      video.likes.splice(likedIndex, 1);
    }
    await video.save();
    res.json({ likesCount: video.likes.length, liked: likedIndex === -1 });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
