import { useState, useEffect } from 'react';
import API from '../utils/api';
import Sidebar from '../components/Sidebar';
import { HiOutlineClipboardList, HiOutlineFolder, HiOutlineClock, HiOutlineCheckCircle, HiOutlineExclamation } from 'react-icons/hi';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await API.get('/dashboard/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    if (status === 'To Do') return 'todo';
    if (status === 'In Progress') return 'in-progress';
    return 'done';
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content"><div className="spinner"></div></main>
    </div>
  );

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header animate-in">
          <h1>Dashboard</h1>
          <p>Overview of your projects and tasks</p>
        </div>

        <div className="stats-grid animate-in">
          <div className="stat-card blue">
            <div className="stat-icon"><HiOutlineClipboardList /></div>
            <div className="stat-value">{stats?.totalTasks || 0}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-icon"><HiOutlineFolder /></div>
            <div className="stat-value">{stats?.totalProjects || 0}</div>
            <div className="stat-label">Projects</div>
          </div>
          <div className="stat-card green">
            <div className="stat-icon"><HiOutlineCheckCircle /></div>
            <div className="stat-value">{stats?.tasksByStatus?.['Done'] || 0}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card amber">
            <div className="stat-icon"><HiOutlineClock /></div>
            <div className="stat-value">{stats?.tasksByStatus?.['In Progress'] || 0}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card red">
            <div className="stat-icon"><HiOutlineExclamation /></div>
            <div className="stat-value">{stats?.overdueTasks || 0}</div>
            <div className="stat-label">Overdue</div>
          </div>
        </div>

        {/* Tasks by Status Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="glass-card animate-in">
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 16 }}>Tasks by Status</h3>
            {['To Do', 'In Progress', 'Done'].map(status => {
              const count = stats?.tasksByStatus?.[status] || 0;
              const total = stats?.totalTasks || 1;
              const pct = Math.round((count / total) * 100) || 0;
              const colors = { 'To Do': '#fbbf24', 'In Progress': '#60a5fa', 'Done': '#34d399' };
              return (
                <div key={status} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 5 }}>
                    <span style={{ color: colors[status] }}>{status}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-input)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: colors[status], borderRadius: 3, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="glass-card animate-in">
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 16 }}>Tasks per User</h3>
            {stats?.tasksPerUser && Object.keys(stats.tasksPerUser).length > 0 ? (
              Object.entries(stats.tasksPerUser).map(([name, data]) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{name}</span>
                  <div style={{ display: 'flex', gap: 10, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span>{data.total} tasks</span>
                    <span style={{ color: 'var(--success)' }}>{data.completed} done</span>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No tasks assigned yet</p>
            )}
          </div>
        </div>

        {/* Recent Tasks */}
        {stats?.recentTasks?.length > 0 && (
          <div className="glass-card animate-in" style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 16 }}>Recent Tasks</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentTasks.map(task => (
                  <tr key={task._id}>
                    <td style={{ fontWeight: 500 }}>{task.title}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{task.project?.name || '—'}</td>
                    <td><span className={`status-badge ${getStatusClass(task.status)}`}>{task.status}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{task.assignedTo?.name || 'Unassigned'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{formatDate(task.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
