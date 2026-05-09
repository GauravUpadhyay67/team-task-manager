const Task = require('../models/Task');
const Project = require('../models/Project');

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Admin of the project)
const createTask = async (req, res) => {
  try {
    const { title, description, project, assignedTo, status, priority, dueDate } = req.body;

    if (!title || !project) {
      return res.status(400).json({ message: 'Please provide task title and project' });
    }

    // Check project exists and user is admin
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const member = projectDoc.members.find(
      m => m.user.toString() === req.user._id.toString()
    );
    if (!member || member.role !== 'Admin') {
      return res.status(403).json({ message: 'Only project admins can create tasks' });
    }

    // If assigning, verify assignee is a project member
    if (assignedTo) {
      const assigneeMember = projectDoc.members.find(
        m => m.user.toString() === assignedTo
      );
      if (!assigneeMember) {
        return res.status(400).json({ message: 'Assigned user is not a member of this project' });
      }
    }

    const task = await Task.create({
      title,
      description: description || '',
      project,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      status: status || 'To Do',
      priority: priority || 'Medium',
      dueDate: dueDate || null
    });

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name');

    res.status(201).json(populated);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error creating task' });
  }
};

// @desc    Get all tasks for a project
// @route   GET /api/tasks/project/:projectId
// @access  Private (Member+)
const getProjectTasks = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check membership
    const isMember = project.members.some(
      m => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this project' });
    }

    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching tasks' });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private (Member+)
const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check membership
    const project = await Project.findById(task.project._id || task.project);
    const isMember = project.members.some(
      m => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this project' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching task' });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private (Admin: all fields, Member: status only)
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const member = project.members.find(
      m => m.user.toString() === req.user._id.toString()
    );
    if (!member) {
      return res.status(403).json({ message: 'You are not a member of this project' });
    }

    if (member.role === 'Member') {
      // Members can only update status of tasks assigned to them
      if (task.assignedTo?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only update tasks assigned to you' });
      }
      // Only allow status update
      if (req.body.status) {
        task.status = req.body.status;
      } else {
        return res.status(403).json({ message: 'Members can only update task status' });
      }
    } else {
      // Admin can update everything
      const { title, description, assignedTo, status, priority, dueDate } = req.body;
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
      if (status) task.status = status;
      if (priority) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate || null;
    }

    await task.save();

    const updated = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name');

    res.json(updated);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error updating task' });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin only)
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    const member = project.members.find(
      m => m.user.toString() === req.user._id.toString()
    );
    if (!member || member.role !== 'Admin') {
      return res.status(403).json({ message: 'Only project admins can delete tasks' });
    }

    await Task.findByIdAndDelete(task._id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting task' });
  }
};

module.exports = {
  createTask,
  getProjectTasks,
  getTask,
  updateTask,
  deleteTask
};
