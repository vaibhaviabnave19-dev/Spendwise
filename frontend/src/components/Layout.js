import React, { useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, MessageSquare, LogOut, Wallet } from 'lucide-react';

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!token) {
    return null;
  }

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Add Expense', path: '/add-expense', icon: <PlusCircle size={20} /> },
    { name: 'AI Roommate', path: '/ai-chat', icon: <MessageSquare size={20} /> },
  ];

  return (
    <div className="app-container">
      {/* Sidebar — Desktop */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-logo">
            <Wallet style={{ color: 'var(--accent-purple)' }} />
            <span style={{ fontWeight: '800' }}>
              Spend<span className="text-gradient">Wise</span>
            </span>
          </div>
          <nav>
            <ul className="sidebar-menu">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            marginBottom: '20px',
            borderTop: '1px solid var(--card-border)',
            paddingTop: '20px'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--accent-purple-glow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              color: 'var(--accent-purple)',
              fontSize: '16px'
            }}>
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user.name || 'Student'}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user.email || 'student@hostel.edu'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-link"
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'var(--accent-rose)'
            }}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Mobile Header */}
        <header className="mobile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={20} style={{ color: 'var(--accent-purple)' }} />
            <h1 style={{ fontSize: '20px', fontWeight: '800' }}>SpendWise</h1>
          </div>
          <button
            onClick={handleLogout}
            style={{ background: 'transparent', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer' }}
          >
            <LogOut size={20} />
          </button>
        </header>

        {children}
      </main>

      {/* Bottom Nav — Mobile */}
      <nav className="mobile-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`mobile-nav-link ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

export default Layout;
