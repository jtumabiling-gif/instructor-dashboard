import './WorkspaceThemeToggle.css';

const WorkspaceThemeToggle = ({ isLightMode, onToggle }) => (
  <button
    className="workspace-theme-toggle"
    type="button"
    onClick={onToggle}
    aria-label={`Switch to ${isLightMode ? 'dark' : 'light'} mode`}
    title={`Switch to ${isLightMode ? 'dark' : 'light'} mode`}
  >
    {isLightMode ? (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ) : (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    )}
  </button>
);

export default WorkspaceThemeToggle;