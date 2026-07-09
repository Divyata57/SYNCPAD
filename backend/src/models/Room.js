import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
  document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  activeUsers: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    socketId: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const Room = mongoose.model('Room', roomSchema);
export default Room;
