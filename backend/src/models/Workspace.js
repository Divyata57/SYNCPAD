import mongoose from 'mongoose';

const workspaceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['owner', 'admin', 'editor', 'viewer'], default: 'viewer' }
  }],
  inviteCode: { type: String, unique: true, required: true }
}, { timestamps: true });

const Workspace = mongoose.model('Workspace', workspaceSchema);
export default Workspace;
