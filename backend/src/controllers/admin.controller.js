import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import Document from '../models/Document.js';
import Message from '../models/Message.js';
import Activity from '../models/Activity.js';
import os from 'os';

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

export const suspendUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { suspend } = req.body; // boolean

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot suspend an Administrator.' });
    }

    user.isSuspended = suspend;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User account has been ${suspend ? 'suspended' : 'unsuspended'} successfully.`,
      user
    });
  } catch (error) {
    next(error);
  }
};

export const deleteWorkspaceAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const workspace = await Workspace.findById(id);
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found.' });

    await Workspace.deleteOne({ _id: id });
    await Document.deleteMany({ workspace: id });
    await Message.deleteMany({ workspace: id });
    await Activity.deleteMany({ workspace: id });

    res.status(200).json({ success: true, message: 'Workspace deleted successfully by Admin.' });
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalWorkspaces = await Workspace.countDocuments();
    const totalDocuments = await Document.countDocuments();
    const totalMessages = await Message.countDocuments();

    // Calculate OS status
    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    const ramUsage = (((totalMem - freeMem) / totalMem) * 100).toFixed(2);

    res.status(200).json({
      success: true,
      analytics: {
        counts: {
          users: totalUsers,
          workspaces: totalWorkspaces,
          documents: totalDocuments,
          messages: totalMessages
        },
        system: {
          platform: os.platform(),
          cpuCount: os.cpus().length,
          ramUsagePercentage: ramUsage,
          uptime: os.uptime()
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getSystemLogs = async (req, res, next) => {
  try {
    const activities = await Activity.find({})
      .populate('user', 'username email')
      .populate('workspace', 'name')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({ success: true, logs: activities });
  } catch (error) {
    next(error);
  }
};
