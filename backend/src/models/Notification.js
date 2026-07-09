import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: {
    type: String,
    enum: ['workspace_invite', 'document_shared', 'mention', 'role_updated', 'new_message', 'document_edited'],
    required: true
  },
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
  document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  isRead: { type: Boolean, default: false },
  content: { type: String, required: true }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
