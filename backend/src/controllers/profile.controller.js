import User from '../models/User.js';

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { bio, skills, phone, avatar, username } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (username) {
      const usernameExists = await User.findOne({ username, _id: { $ne: req.user._id } });
      if (usernameExists) {
        return res.status(400).json({ success: false, message: 'Username is already taken.' });
      }
      user.username = username;
    }

    user.bio = bio !== undefined ? bio : user.bio;
    user.skills = skills !== undefined ? skills : user.skills;
    user.phone = phone !== undefined ? phone : user.phone;
    user.avatar = avatar !== undefined ? avatar : user.avatar;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        skills: user.skills,
        phone: user.phone,
        role: user.role,
        themePreference: user.themePreference
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateThemePreference = async (req, res, next) => {
  try {
    const { themePreference } = req.body;
    if (!['light', 'dark'].includes(themePreference)) {
      return res.status(400).json({ success: false, message: 'Invalid theme choice.' });
    }

    const user = await User.findById(req.user._id);
    user.themePreference = themePreference;
    await user.save();

    res.status(200).json({ success: true, themePreference: user.themePreference });
  } catch (error) {
    next(error);
  }
};
