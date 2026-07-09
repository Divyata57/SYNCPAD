import mongoose from 'mongoose';

const blockSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ['h1', 'h2', 'h3', 'p', 'todo', 'list'], default: 'p' },
  content: { type: String, default: '' },
  lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  lockedAt: { type: Date, default: null }
});

const documentSchema = new mongoose.Schema({
  title: { type: String, required: true, default: 'Untitled Document' },
  blocks: { type: [blockSchema], default: [{ id: 'init-block-1', type: 'p', content: '' }] },
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isPinned: { type: Boolean, default: false },
  isFavorite: { type: Boolean, default: false },
  versionHistory: [{
    blocks: [blockSchema],
    title: String,
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const Document = mongoose.model('Document', documentSchema);
export default Document;
