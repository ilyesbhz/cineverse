import Reel from '../models/reel.js';

export const uploadReel = async (req, res) => {
  try {
    const { title } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Reel video is required' });
    }

    const reel = await Reel.create({
      title,
      videoUrl: `/uploads/reels/${req.file.filename}`,
      uploadedBy: req.user._id
    });

    return res.status(201).json({ message: 'Reel uploaded successfully', reel });
  } catch (error) {
    return res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

export const getAllReels = async (req, res) => {
  try {
    const reels = await Reel.find().populate('uploadedBy', 'name username').sort({ createdAt: -1 });
    return res.json(reels);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const incrementView = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);

    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    reel.views += 1;
    await reel.save();

    return res.json({ views: reel.views });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const likeReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);

    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    reel.likes += 1;
    await reel.save();

    return res.json({ likes: reel.likes });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteReel = async (req, res) => {
  try {
    const reel = await Reel.findByIdAndDelete(req.params.id);

    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    return res.json({ message: 'Reel deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
