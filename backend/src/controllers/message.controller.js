import Message from '../models/Message.js';
import Workspace from '../models/Workspace.js';
import Activity from '../models/Activity.js';

export const getMessages = async (req, res, next) => {
  try {
    const { workspaceId } = req.query;
    if (!workspaceId) return res.status(400).json({ success: false, message: 'workspaceId is required.' });

    const messages = await Message.find({ workspace: workspaceId })
      .populate('sender', 'username email avatar')
      .populate('replies.sender', 'username email avatar')
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { workspaceId, content } = req.body;
    if (!workspaceId) return res.status(400).json({ success: false, message: 'workspaceId is required.' });

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found.' });

    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => ({
        name: file.originalname,
        url: `/uploads/${file.filename}`,
        type: file.mimetype,
        size: file.size
      }));
    }

    const message = new Message({
      sender: req.user._id,
      workspace: workspaceId,
      content: content || '',
      attachments,
      seenBy: [req.user._id]
    });

    await message.save();

    const populated = await Message.findById(message._id)
      .populate('sender', 'username email avatar');

    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id);

    if (!message) return res.status(404).json({ success: false, message: 'Message not found.' });

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this message.' });
    }

    await Message.deleteOne({ _id: id });
    res.status(200).json({ success: true, message: 'Message deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

export const addReaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;

    if (!emoji) return res.status(400).json({ success: false, message: 'Emoji is required.' });

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found.' });

    const existingReaction = message.reactions.find(r => r.emoji === emoji);

    if (existingReaction) {
      const userIndex = existingReaction.users.indexOf(req.user._id);
      if (userIndex > -1) {
        // Toggle reaction off
        existingReaction.users.splice(userIndex, 1);
        if (existingReaction.users.length === 0) {
          message.reactions = message.reactions.filter(r => r.emoji !== emoji);
        }
      } else {
        // Toggle reaction on
        existingReaction.users.push(req.user._id);
      }
    } else {
      message.reactions.push({ emoji, users: [req.user._id] });
    }

    await message.save();

    const populated = await Message.findById(id)
      .populate('sender', 'username email avatar')
      .populate('replies.sender', 'username email avatar');

    res.status(200).json({ success: true, message: populated });
  } catch (error) {
    next(error);
  }
};

export const addReply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) return res.status(400).json({ success: false, message: 'Content is required.' });

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found.' });

    message.replies.push({
      sender: req.user._id,
      content,
      createdAt: new Date()
    });

    await message.save();

    const populated = await Message.findById(id)
      .populate('sender', 'username email avatar')
      .populate('replies.sender', 'username email avatar');

    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    next(error);
  }
};

export const markAsSeen = async (req, res, next) => {
  try {
    const { workspaceId } = req.body;
    if (!workspaceId) return res.status(400).json({ success: false, message: 'workspaceId is required.' });

    await Message.updateMany(
      { workspace: workspaceId, seenBy: { $ne: req.user._id } },
      { $addToSet: { seenBy: req.user._id } }
    );

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
