const express = require('express');
const router = express.Router();
const {
  createTask,
  getProjectTasks,
  getTask,
  updateTask,
  deleteTask
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createTask);
router.get('/project/:projectId', protect, getProjectTasks);

router.route('/:id')
  .get(protect, getTask)
  .put(protect, updateTask)
  .delete(protect, deleteTask);

module.exports = router;
