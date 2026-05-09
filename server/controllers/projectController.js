const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Please provide a project name' });
    }

    const project = await Project.create({
      name,
      description: description || '',
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'Admin' }]
    });

    const populated = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error creating project' });
  }
};

// @desc    Get all projects for current user
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      'members.user': req.user._id
    })
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .sort({ createdAt: -1 });

    // Add task count for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const taskCount = await Task.countDocuments({ project: project._id });
        const projectObj = project.toObject();
        projectObj.taskCount = taskCount;
        return projectObj;
      })
    );

    res.json(projectsWithCounts);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching projects' });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private (Member+)
const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check membership
    const isMember = project.members.some(
      m => m.user._id.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this project' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching project' });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin only)
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check admin
    const member = project.members.find(
      m => m.user.toString() === req.user._id.toString()
    );
    if (!member || member.role !== 'Admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { name, description } = req.body;
    if (name) project.name = name;
    if (description !== undefined) project.description = description;

    await project.save();

    const updated = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating project' });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin only)
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check admin
    const member = project.members.find(
      m => m.user.toString() === req.user._id.toString()
    );
    if (!member || member.role !== 'Admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Delete all tasks in this project
    await Task.deleteMany({ project: project._id });
    await Project.findByIdAndDelete(project._id);

    res.json({ message: 'Project and all associated tasks deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting project' });
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private (Admin only)
const addMember = async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide member email' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check admin
    const adminMember = project.members.find(
      m => m.user.toString() === req.user._id.toString()
    );
    if (!adminMember || adminMember.role !== 'Admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Find user by email
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    // Check if already a member
    const alreadyMember = project.members.some(
      m => m.user.toString() === userToAdd._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member of this project' });
    }

    project.members.push({
      user: userToAdd._id,
      role: role || 'Member'
    });

    await project.save();

    const updated = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error adding member' });
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private (Admin only)
const removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check admin
    const adminMember = project.members.find(
      m => m.user.toString() === req.user._id.toString()
    );
    if (!adminMember || adminMember.role !== 'Admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Cannot remove the owner
    if (req.params.userId === project.owner.toString()) {
      return res.status(400).json({ message: 'Cannot remove the project owner' });
    }

    project.members = project.members.filter(
      m => m.user.toString() !== req.params.userId
    );

    // Unassign removed user from tasks
    await Task.updateMany(
      { project: project._id, assignedTo: req.params.userId },
      { assignedTo: null }
    );

    await project.save();

    const updated = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error removing member' });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember
};
