import Workspace from '../models/Workspace.js';
import User from '../models/User.js';
import Document from '../models/Document.js';
import Message from '../models/Message.js';
import Activity from '../models/Activity.js';

export const createWorkspace = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Workspace name is required.' });

    const inviteCode = 'INV-' + Math.random().toString(36).substring(2, 11).toUpperCase();

    const workspace = new Workspace({
      name,
      description,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }],
      inviteCode
    });

    await workspace.save();

    // Log Activity
    const activity = new Activity({
      workspace: workspace._id,
      user: req.user._id,
      action: 'created the workspace',
      targetType: 'workspace',
      targetId: workspace._id,
      details: `Workspace: ${name}`
    });
    await activity.save();

    res.status(201).json({ success: true, workspace });
  } catch (error) {
    next(error);
  }
};

export const getWorkspaces = async (req, res, next) => {
  try {
    const workspaces = await Workspace.find({ 'members.user': req.user._id })
      .populate('owner', 'username email avatar')
      .populate('members.user', 'username email avatar')
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, workspaces });
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const workspace = await Workspace.findById(id)
      .populate('owner', 'username email avatar')
      .populate('members.user', 'username email avatar skills bio phone');

    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found.' });

    const isMember = workspace.members.some(m => m.user._id.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied. You are not a member.' });
    }

    res.status(200).json({ success: true, workspace });
  } catch (error) {
    next(error);
  }
};

export const editWorkspace = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const workspace = await Workspace.findById(id);
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found.' });

    const member = workspace.members.find(m => m.user.toString() === req.user._id.toString());
    if (!member || !['owner', 'admin'].includes(member.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Only Owners and Admins can edit.' });
    }

    workspace.name = name || workspace.name;
    workspace.description = description !== undefined ? description : workspace.description;
    await workspace.save();

    // Log Activity
    const activity = new Activity({
      workspace: workspace._id,
      user: req.user._id,
      action: 'updated workspace details',
      targetType: 'workspace',
      targetId: workspace._id
    });
    await activity.save();

    res.status(200).json({ success: true, workspace });
  } catch (error) {
    next(error);
  }
};

export const deleteWorkspace = async (req, res, next) => {
  try {
    const { id } = req.params;
    const workspace = await Workspace.findById(id);

    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found.' });

    // Only owner can delete workspace
    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied. Only the owner can delete the workspace.' });
    }

    await Workspace.deleteOne({ _id: id });
    await Document.deleteMany({ workspace: id });
    await Message.deleteMany({ workspace: id });
    await Activity.deleteMany({ workspace: id });

    res.status(200).json({ success: true, message: 'Workspace and all associated contents deleted.' });
  } catch (error) {
    next(error);
  }
};

export const joinWithInviteCode = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) return res.status(400).json({ success: false, message: 'Invite code is required.' });

    const workspace = await Workspace.findOne({ inviteCode });
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found for this invite code.' });

    const isMember = workspace.members.some(m => m.user.toString() === req.user._id.toString());
    if (isMember) {
      return res.status(400).json({ success: false, message: 'You are already a member of this workspace.' });
    }

    workspace.members.push({ user: req.user._id, role: 'editor' });
    await workspace.save();

    // Log Activity
    const activity = new Activity({
      workspace: workspace._id,
      user: req.user._id,
      action: 'joined the workspace via invite code',
      targetType: 'member',
      targetId: req.user._id
    });
    await activity.save();

    res.status(200).json({ success: true, message: 'Joined workspace successfully.', workspace });
  } catch (error) {
    next(error);
  }
};

export const inviteMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body; // role can be admin, editor, viewer

    if (!email) return res.status(400).json({ success: false, message: 'User email is required.' });

    const workspace = await Workspace.findById(id);
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found.' });

    // Validate permission
    const currentMember = workspace.members.find(m => m.user.toString() === req.user._id.toString());
    if (!currentMember || !['owner', 'admin'].includes(currentMember.role)) {
      return res.status(403).json({ success: false, message: 'Only Owners and Admins can invite members.' });
    }

    const invitedUser = await User.findOne({ email: email.toLowerCase() });
    if (!invitedUser) return res.status(404).json({ success: false, message: 'User with this email not found.' });

    const isAlreadyMember = workspace.members.some(m => m.user.toString() === invitedUser._id.toString());
    if (isAlreadyMember) {
      return res.status(400).json({ success: false, message: 'User is already a member.' });
    }

    const userRole = ['admin', 'editor', 'viewer'].includes(role) ? role : 'viewer';
    workspace.members.push({ user: invitedUser._id, role: userRole });
    await workspace.save();

    // Log Activity
    const activity = new Activity({
      workspace: workspace._id,
      user: req.user._id,
      action: `invited ${invitedUser.username} to the workspace as ${userRole}`,
      targetType: 'member',
      targetId: invitedUser._id
    });
    await activity.save();

    res.status(200).json({ success: true, message: 'User invited successfully.', workspace });
  } catch (error) {
    next(error);
  }
};

export const leaveWorkspace = async (req, res, next) => {
  try {
    const { id } = req.params;
    const workspace = await Workspace.findById(id);
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found.' });

    if (workspace.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Owner cannot leave the workspace. Transfer ownership or delete it.' });
    }

    const isMember = workspace.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(400).json({ success: false, message: 'You are not a member.' });

    workspace.members = workspace.members.filter(m => m.user.toString() !== req.user._id.toString());
    await workspace.save();

    // Log Activity
    const activity = new Activity({
      workspace: workspace._id,
      user: req.user._id,
      action: 'left the workspace',
      targetType: 'member',
      targetId: req.user._id
    });
    await activity.save();

    res.status(200).json({ success: true, message: 'Left workspace successfully.' });
  } catch (error) {
    next(error);
  }
};

export const updateMemberRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({ success: false, message: 'userId and role are required.' });
    }

    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    const workspace = await Workspace.findById(id);
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found.' });

    // Validate permission
    const currentMember = workspace.members.find(m => m.user.toString() === req.user._id.toString());
    if (!currentMember || !['owner', 'admin'].includes(currentMember.role)) {
      return res.status(403).json({ success: false, message: 'Only Owners and Admins can change member roles.' });
    }

    const targetMember = workspace.members.find(m => m.user.toString() === userId.toString());
    if (!targetMember) return res.status(404).json({ success: false, message: 'Target user is not a member.' });

    if (targetMember.role === 'owner') {
      return res.status(400).json({ success: false, message: 'Cannot modify Owner role.' });
    }

    const previousRole = targetMember.role;
    targetMember.role = role;
    await workspace.save();

    // Log Activity
    const activity = new Activity({
      workspace: workspace._id,
      user: req.user._id,
      action: `updated role of member ${userId} from ${previousRole} to ${role}`,
      targetType: 'member',
      targetId: userId
    });
    await activity.save();

    res.status(200).json({ success: true, message: 'Member role updated successfully.' });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ success: false, message: 'userId is required.' });

    const workspace = await Workspace.findById(id);
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found.' });

    const currentMember = workspace.members.find(m => m.user.toString() === req.user._id.toString());
    if (!currentMember || !['owner', 'admin'].includes(currentMember.role)) {
      return res.status(403).json({ success: false, message: 'Only Owners and Admins can remove members.' });
    }

    const targetMember = workspace.members.find(m => m.user.toString() === userId.toString());
    if (!targetMember) return res.status(404).json({ success: false, message: 'User not a member.' });

    if (targetMember.role === 'owner') {
      return res.status(400).json({ success: false, message: 'Cannot remove the workspace Owner.' });
    }

    workspace.members = workspace.members.filter(m => m.user.toString() !== userId.toString());
    await workspace.save();

    const activity = new Activity({
      workspace: workspace._id,
      user: req.user._id,
      action: `removed member ${userId} from the workspace`,
      targetType: 'member',
      targetId: userId
    });
    await activity.save();

    res.status(200).json({ success: true, message: 'Member removed successfully.' });
  } catch (error) {
    next(error);
  }
};
