import Workspace from '../models/Workspace.js';
import Document from '../models/Document.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

export const globalSearch = async (req, res, next) => {
  try {
    const { query, workspaceId } = req.query;
    if (!query) return res.status(400).json({ success: false, message: 'Search query is required.' });

    // 1. Find user's workspaces
    const userWorkspaces = await Workspace.find({ 'members.user': req.user._id });
    const workspaceIds = userWorkspaces.map(w => w._id);

    // If a specific workspace filter is provided, check access
    let targetWorkspaceIds = workspaceIds;
    if (workspaceId) {
      if (!workspaceIds.some(id => id.toString() === workspaceId.toString())) {
        return res.status(403).json({ success: false, message: 'No access to specified workspace.' });
      }
      targetWorkspaceIds = [workspaceId];
    }

    const regex = new RegExp(query, 'i');

    // 2. Search Workspaces
    const workspaces = await Workspace.find({
      _id: { $in: targetWorkspaceIds },
      $or: [{ name: regex }, { description: regex }]
    }).limit(10);

    // 3. Search Documents
    const documents = await Document.find({
      workspace: { $in: targetWorkspaceIds },
      $or: [
        { title: regex },
        { 'blocks.content': regex }
      ]
    }).populate('workspace', 'name').limit(15);

    // 4. Search Messages
    const messages = await Message.find({
      workspace: { $in: targetWorkspaceIds },
      content: regex
    }).populate('sender', 'username email avatar')
      .populate('workspace', 'name')
      .limit(15);

    // 5. Search Users (system-wide matching email or username)
    const users = await User.find({
      $or: [{ username: regex }, { email: regex }]
    }).select('username email avatar bio').limit(10);

    res.status(200).json({
      success: true,
      results: {
        workspaces,
        documents,
        messages,
        users
      }
    });
  } catch (error) {
    next(error);
  }
};
