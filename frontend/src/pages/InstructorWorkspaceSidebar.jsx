const NAVIGATION = [
  { id: 'overview', label: 'Command Overview', icon: 'dashboard' },
  { id: 'students', label: 'Student Roster', icon: 'learners' },
  { id: 'scenario', label: 'Scenario Builder', icon: 'scenario' },
  { id: 'records', label: 'Assessment Records', icon: 'assessments' },
];

const ICON_PATHS = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  learners: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a6 6 0 0 1 12 0v1M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v1" /></>,
  assessments: <><path d="M7 3h10l3 3v15H4V3z" /><path d="M14 3v4h6M8 12h8M8 16h5" /></>,
  scenario: <><path d="M4 19V5M4 19h16" /><path d="m7 15 3-4 3 2 5-7" /><circle cx="18" cy="6" r="1.5" /></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></>,
};

const SidebarIcon = ({ name }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {ICON_PATHS[name]}
  </svg>
);

const InstructorWorkspaceSidebar = ({ activeSection, onNavigate, onLogout, pendingCount, username }) => (
  <aside className="instructor-workspace-sidebar">
    <div className="instructor-brand">
      <span className="instructor-brand-mark" aria-hidden="true"><SidebarIcon name="scenario" /></span>
      <span><strong>WharfIntel</strong><small>INSTRUCTOR PORTAL</small></span>
    </div>

    <nav className="instructor-workspace-nav" aria-label="Instructor workspace">
      <span className="instructor-nav-heading">VESSEL SIMULATION</span>
      {NAVIGATION.map((item) => (
        <button
          className={`instructor-workspace-nav-item ${activeSection === item.id ? 'is-active' : ''}`}
          type="button"
          key={item.id}
          onClick={() => onNavigate(item.id)}
          aria-current={activeSection === item.id ? 'page' : undefined}
        >
          <SidebarIcon name={item.icon} />
          <span>{item.label}</span>
          {item.id === 'records' && pendingCount > 0 && <span className="instructor-nav-count">{pendingCount}</span>}
        </button>
      ))}
    </nav>

    <div className="instructor-sidebar-footer">
      <div className="instructor-sidebar-profile">
        <span className="instructor-avatar">{username.slice(0, 1).toUpperCase()}</span>
        <span><strong>{username}</strong><small>Simulation Instructor</small></span>
      </div>
      <button className="instructor-sidebar-logout" type="button" onClick={onLogout}>
        <SidebarIcon name="logout" /><span>Sign out</span>
      </button>
    </div>
  </aside>
);

export default InstructorWorkspaceSidebar;