const Task = require('../models/Task');
const Project = require('../models/Project');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getStats = async (req, res) => {
  try {
    // Get all projects where user is a member
    const userProjects = await Project.find({
      'members.user': req.user._id
    });

    const projectIds = userProjects.map(p => p._id);

    // Get all tasks in user's projects
    const allTasks = await Task.find({ project: { $in: projectIds } })
      .populate('assignedTo', 'name email')
      .populate('project', 'name');

    // Total tasks
    const totalTasks = allTasks.length;

    // Tasks by status
    const tasksByStatus = {
      'To Do': allTasks.filter(t => t.status === 'To Do').length,
      'In Progress': allTasks.filter(t => t.status === 'In Progress').length,
      'Done': allTasks.filter(t => t.status === 'Done').length
    };

    // Overdue tasks (past due date and not done)
    const now = new Date();
    const overdueTasks = allTasks.filter(
      t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'Done'
    ).length;

    // Tasks per user
    const tasksPerUser = {};
    allTasks.forEach(task => {
      if (task.assignedTo) {
        const userName = task.assignedTo.name;
        if (!tasksPerUser[userName]) {
          tasksPerUser[userName] = { total: 0, completed: 0 };
        }
        tasksPerUser[userName].total++;
        if (task.status === 'Done') {
          tasksPerUser[userName].completed++;
        }
      }
    });

    // Recent tasks (last 5)
    const recentTasks = allTasks
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    // Project count
    const totalProjects = userProjects.length;

    res.json({
      totalTasks,
      totalProjects,
      tasksByStatus,
      overdueTasks,
      tasksPerUser,
      recentTasks
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching dashboard stats' });
  }
};

module.exports = { getStats };
