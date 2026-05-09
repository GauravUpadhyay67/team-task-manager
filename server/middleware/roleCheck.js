const Project = require('../models/Project');

// Check if user is a member of the project
const isProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id || req.body.project;
    
    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const member = project.members.find(
      m => m.user.toString() === req.user._id.toString()
    );

    if (!member) {
      return res.status(403).json({ message: 'You are not a member of this project' });
    }

    req.project = project;
    req.memberRole = member.role;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Server error checking project membership' });
  }
};

// Check if user is Admin of the project
const isProjectAdmin = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id || req.body.project;
    
    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const member = project.members.find(
      m => m.user.toString() === req.user._id.toString()
    );

    if (!member || member.role !== 'Admin') {
      return res.status(403).json({ message: 'Admin access required for this action' });
    }

    req.project = project;
    req.memberRole = 'Admin';
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Server error checking admin access' });
  }
};

module.exports = { isProjectMember, isProjectAdmin };
