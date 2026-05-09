import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil, HiOutlineUserAdd, HiOutlineArrowLeft, HiOutlineClock, HiOutlineX } from 'react-icons/hi';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignedTo: '', status: 'To Do', priority: 'Medium', dueDate: '' });
  const [memberEmail, setMemberEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const isAdmin = project?.members?.find(m => (m.user?._id || m.user) === user?._id)?.role === 'Admin';

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    try {
      const [projRes, taskRes] = await Promise.all([
        API.get(`/projects/${id}`),
        API.get(`/tasks/project/${id}`)
      ]);
      setProject(projRes.data);
      setTasks(taskRes.data);
    } catch (err) {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const openCreateTask = () => {
    setEditingTask(null);
    setTaskForm({ title: '', description: '', assignedTo: '', status: 'To Do', priority: 'Medium', dueDate: '' });
    setShowTaskModal(true);
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      assignedTo: task.assignedTo?._id || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
    });
    setShowTaskModal(true);
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return toast.error('Task title is required');
    setSaving(true);
    try {
      if (editingTask) {
        await API.put(`/tasks/${editingTask._id}`, { ...taskForm, project: id });
        toast.success('Task updated!');
      } else {
        await API.post('/tasks', { ...taskForm, project: id });
        toast.success('Task created!');
      }
      setShowTaskModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await API.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
      toast.success('Status updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot update status');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await API.delete(`/tasks/${taskId}`);
      toast.success('Task deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberEmail.trim()) return toast.error('Enter an email');
    try {
      await API.post(`/projects/${id}/members`, { email: memberEmail });
      toast.success('Member added!');
      setMemberEmail('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await API.delete(`/projects/${id}/members/${userId}`);
      toast.success('Member removed');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove');
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this project and all its tasks? This cannot be undone.')) return;
    try {
      await API.delete(`/projects/${id}`);
      toast.success('Project deleted');
      navigate('/projects');
    } catch (err) {
      toast.error('Failed to delete project');
    }
  };

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  const isOverdue = (d) => d && new Date(d) < new Date();

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const columns = [
    { key: 'To Do', label: 'To Do', className: 'column-todo' },
    { key: 'In Progress', label: 'In Progress', className: 'column-progress' },
    { key: 'Done', label: 'Done', className: 'column-done' }
  ];

  if (loading) return (
    <div className="app-layout"><Sidebar /><main className="main-content"><div className="spinner"></div></main></div>
  );

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header animate-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <button className="btn btn-secondary btn-sm" style={{ marginBottom: 10 }} onClick={() => navigate('/projects')}>
              <HiOutlineArrowLeft /> Back to Projects
            </button>
            <h1>{project?.name}</h1>
            <p>{project?.description || 'No description'}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {isAdmin && (
              <>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowMemberModal(true)}><HiOutlineUserAdd /> Members</button>
                <button className="btn btn-primary btn-sm" onClick={openCreateTask}><HiOutlinePlus /> Add Task</button>
                <button className="btn btn-danger btn-sm btn-icon" onClick={handleDeleteProject} title="Delete Project"><HiOutlineTrash /></button>
              </>
            )}
          </div>
        </div>

        {/* Task Board */}
        <div className="task-board animate-in">
          {columns.map(col => {
            const colTasks = tasks.filter(t => t.status === col.key);
            return (
              <div key={col.key} className={`task-column ${col.className}`}>
                <div className="task-column-header">
                  <h3>{col.label}</h3>
                  <span className="count">{colTasks.length}</span>
                </div>
                <div className="task-list">
                  {colTasks.map(task => (
                    <div key={task._id} className="task-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <h4>{task.title}</h4>
                        <span className={`priority-badge ${task.priority.toLowerCase()}`}>{task.priority}</span>
                      </div>
                      {task.description && <p className="task-desc">{task.description}</p>}
                      
                      {/* Status quick-change */}
                      <div style={{ marginBottom: 8 }}>
                        <select
                          className="form-control"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          value={task.status}
                          onChange={e => handleStatusChange(task._id, e.target.value)}
                        >
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Done">Done</option>
                        </select>
                      </div>

                      <div className="task-footer">
                        <div className="task-assignee">
                          {task.assignedTo ? (
                            <>
                              <span className="mini-avatar">{getInitials(task.assignedTo.name)}</span>
                              {task.assignedTo.name}
                            </>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {task.dueDate && (
                            <span className={`task-due ${isOverdue(task.dueDate) && task.status !== 'Done' ? 'overdue' : ''}`}>
                              <HiOutlineClock /> {formatDate(task.dueDate)}
                            </span>
                          )}
                          {isAdmin && (
                            <>
                              <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openEditTask(task)} title="Edit"><HiOutlinePencil /></button>
                              <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDeleteTask(task._id)} title="Delete"><HiOutlineTrash /></button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', padding: 20 }}>No tasks</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Task Modal */}
        {showTaskModal && (
          <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingTask ? 'Edit Task' : 'Create Task'}</h2>
                <button className="modal-close" onClick={() => setShowTaskModal(false)}>×</button>
              </div>
              <form onSubmit={handleTaskSubmit}>
                <div className="form-group">
                  <label>Title</label>
                  <input className="form-control" placeholder="Task title" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea className="form-control" placeholder="Describe the task..." value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label>Priority</label>
                    <select className="form-control" value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select className="form-control" value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}>
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label>Assign To</label>
                    <select className="form-control" value={taskForm.assignedTo} onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })}>
                      <option value="">Unassigned</option>
                      {project?.members?.map(m => (
                        <option key={m.user?._id || m.user} value={m.user?._id || m.user}>{m.user?.name || 'User'}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Due Date</label>
                    <input type="date" className="form-control" value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Members Modal */}
        {showMemberModal && (
          <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Team Members</h2>
                <button className="modal-close" onClick={() => setShowMemberModal(false)}>×</button>
              </div>
              {isAdmin && (
                <form onSubmit={handleAddMember} style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
                  <input className="form-control" placeholder="Enter user email" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} style={{ flex: 1 }} />
                  <button type="submit" className="btn btn-primary btn-sm">Add</button>
                </form>
              )}
              <div className="member-list">
                {project?.members?.map(m => (
                  <div key={m.user?._id || m.user} className="member-item">
                    <div className="user-avatar" style={{ width: 32, height: 32, fontSize: '0.72rem' }}>{getInitials(m.user?.name)}</div>
                    <div className="member-info">
                      <div className="member-name">{m.user?.name}</div>
                      <div className="member-email">{m.user?.email}</div>
                    </div>
                    <span className={`role-badge ${m.role.toLowerCase()}`}>{m.role}</span>
                    {isAdmin && m.role !== 'Admin' && (
                      <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleRemoveMember(m.user?._id || m.user)} title="Remove">
                        <HiOutlineX />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProjectDetail;
