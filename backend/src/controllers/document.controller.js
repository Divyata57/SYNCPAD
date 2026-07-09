import Document from '../models/Document.js';
import Workspace from '../models/Workspace.js';
import Activity from '../models/Activity.js';

export const createDocument = async (req, res, next) => {
  try {
    const { workspaceId, title } = req.body;
    if (!workspaceId) return res.status(400).json({ success: false, message: 'workspaceId is required.' });

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found.' });

    const doc = new Document({
      title: title || 'Untitled Document',
      workspace: workspaceId,
      blocks: [{ id: 'block-' + Date.now(), type: 'p', content: '' }],
      lastEditedBy: req.user._id
    });

    await doc.save();

    // Log Activity
    const activity = new Activity({
      workspace: workspaceId,
      user: req.user._id,
      action: `created document: ${doc.title}`,
      targetType: 'document',
      targetId: doc._id
    });
    await activity.save();

    res.status(201).json({ success: true, document: doc });
  } catch (error) {
    next(error);
  }
};

export const getDocuments = async (req, res, next) => {
  try {
    const { workspaceId } = req.query;
    if (!workspaceId) return res.status(400).json({ success: false, message: 'workspaceId is required.' });

    const docs = await Document.find({ workspace: workspaceId })
      .populate('lastEditedBy', 'username email avatar')
      .sort({ isPinned: -1, updatedAt: -1 });

    res.status(200).json({ success: true, documents: docs });
  } catch (error) {
    next(error);
  }
};

export const getDocumentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await Document.findById(id)
      .populate('lastEditedBy', 'username email avatar');

    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });

    res.status(200).json({ success: true, document: doc });
  } catch (error) {
    next(error);
  }
};

export const updateDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, blocks } = req.body;

    const doc = await Document.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });

    // Store previous version in history before updating
    if (doc.versionHistory.length >= 20) {
      doc.versionHistory.shift(); // keep last 20 edits
    }

    doc.versionHistory.push({
      blocks: doc.blocks,
      title: doc.title,
      editedBy: doc.lastEditedBy || req.user._id,
      timestamp: doc.updatedAt || new Date()
    });

    doc.title = title !== undefined ? title : doc.title;
    doc.blocks = blocks !== undefined ? blocks : doc.blocks;
    doc.lastEditedBy = req.user._id;

    await doc.save();

    // Log Activity
    const activity = new Activity({
      workspace: doc.workspace,
      user: req.user._id,
      action: `edited document: ${doc.title}`,
      targetType: 'document',
      targetId: doc._id
    });
    await activity.save();

    res.status(200).json({ success: true, document: doc });
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await Document.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });

    await Document.deleteOne({ _id: id });

    // Log Activity
    const activity = new Activity({
      workspace: doc.workspace,
      user: req.user._id,
      action: `deleted document: ${doc.title}`,
      targetType: 'document',
      targetId: id
    });
    await activity.save();

    res.status(200).json({ success: true, message: 'Document deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

export const togglePin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await Document.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });

    doc.isPinned = !doc.isPinned;
    await doc.save();

    res.status(200).json({ success: true, isPinned: doc.isPinned });
  } catch (error) {
    next(error);
  }
};

export const toggleFavorite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await Document.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });

    doc.isFavorite = !doc.isFavorite;
    await doc.save();

    res.status(200).json({ success: true, isFavorite: doc.isFavorite });
  } catch (error) {
    next(error);
  }
};

export const getVersionHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await Document.findById(id)
      .populate('versionHistory.editedBy', 'username email avatar');

    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });

    res.status(200).json({ success: true, versionHistory: doc.versionHistory });
  } catch (error) {
    next(error);
  }
};

export const revertVersion = async (req, res, next) => {
  try {
    const { id, versionId } = req.params;

    const doc = await Document.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });

    const version = doc.versionHistory.id(versionId);
    if (!version) return res.status(404).json({ success: false, message: 'Version not found.' });

    // Store current state as a version before reverting
    doc.versionHistory.push({
      blocks: doc.blocks,
      title: doc.title,
      editedBy: req.user._id,
      timestamp: new Date()
    });

    doc.blocks = version.blocks;
    doc.title = version.title;
    doc.lastEditedBy = req.user._id;

    await doc.save();

    res.status(200).json({ success: true, message: 'Reverted document successfully.', document: doc });
  } catch (error) {
    next(error);
  }
};
