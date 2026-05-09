const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a project name'],
    trim: true,
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['Admin', 'Member'],
      default: 'Member'
    }
  }]
}, {
  timestamps: true
});

// Ensure owner is always in members as Admin
projectSchema.pre('save', function() {
  const ownerExists = this.members.some(
    m => m.user.toString() === this.owner.toString()
  );
  if (!ownerExists) {
    this.members.unshift({ user: this.owner, role: 'Admin' });
  }
});

module.exports = mongoose.model('Project', projectSchema);
