import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { HiOutlineViewGrid, HiOutlineFolder, HiOutlineLogout, HiOutlineMenu, HiOutlineX } from 'react-icons/hi';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <HiOutlineViewGrid /> },
    { path: '/projects', label: 'Projects', icon: <HiOutlineFolder /> },
  ];

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      <button className="mobile-toggle" onClick={() => setMobileOpen(true)}>
        <HiOutlineMenu />
      </button>
      <div className={`sidebar-overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} />
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="logo-icon">TM</div>
          <div>
            <h2>TaskManager</h2>
            <span>Team Collaboration</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{getInitials(user?.name)}</div>
            <div className="user-details">
              <div className="name">{user?.name}</div>
              <div className="email">{user?.email}</div>
            </div>
          </div>
          <button className="btn-logout" onClick={logout}>
            <HiOutlineLogout /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
