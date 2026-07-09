import Activity from '../models/Activity.js';

export const getActivityLogs = async (req, res, next) => {
  try {
    const { workspaceId } = req.query;
    if (!workspaceId) return res.status(400).json({ success: false, message: 'workspaceId is required.' });

    const activities = await Activity.find({ workspace: workspaceId })
      .populate('user', 'username email avatar')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({ success: true, activities });
  } catch (error) {
    next(error);
  }
};
