import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineFolder, HiOutlineUserGroup, HiOutlineClipboardList } from 'react-icons/hi';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await API.get('/projects');
      setProjects(data);
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Project name is required');
    setCreating(true);
    try {
      await API.post('/projects', { name, description });
      toast.success('Project created!');
      setShowModal(false);
      setName('');
      setDescription('');
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const getUserRole = (project) => {
    const member = project.members?.find(m => (m.user?._id || m.user) === user?._id);
    return member?.role || 'Member';
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header animate-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>Projects</h1>
            <p>Manage your team projects</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <HiOutlinePlus /> New Project
          </button>
        </div>

        {loading ? <div className="spinner"></div> : projects.length === 0 ? (
          <div className="empty-state animate-in">
            <HiOutlineFolder />
            <h3>No projects yet</h3>
            <p>Create your first project to get started</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
              <HiOutlinePlus /> Create Project
            </button>
          </div>
        ) : (
          <div className="projects-grid animate-in">
            {projects.map(project => (
              <div key={project._id} className="project-card" onClick={() => navigate(`/projects/${project._id}`)}>
                <span className={`role-badge ${getUserRole(project).toLowerCase()}`}>{getUserRole(project)}</span>
                <h3>{project.name}</h3>
                <p className="project-desc">{project.description || 'No description'}</p>
                <div className="project-meta">
                  <span><HiOutlineUserGroup /> {project.members?.length || 0} members</span>
                  <span><HiOutlineClipboardList /> {project.taskCount || 0} tasks</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Create New Project</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label htmlFor="project-name">Project Name</label>
                  <input id="project-name" className="form-control" placeholder="My Awesome Project" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="project-desc">Description (optional)</label>
                  <textarea id="project-desc" className="form-control" placeholder="Describe your project..." value={description} onChange={e => setDescription(e.target.value)} />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? 'Creating...' : 'Create Project'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Projects;
