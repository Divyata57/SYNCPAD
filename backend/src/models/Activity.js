import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  targetType: { type: String, enum: ['workspace', 'document', 'message', 'member', 'file'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId },
  details: { type: String, default: '' }
}, { timestamps: true });

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;
