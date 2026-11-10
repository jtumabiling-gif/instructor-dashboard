import { createElement, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertTriangle, CheckCircle2, Clock3, Gauge, Shield, Ship, Users, X } from 'lucide-react';
import InstructorWorkspaceSidebar from './InstructorWorkspaceSidebar';
import ScenarioBuilder from './ScenarioBuilder';
import StudentPerformanceTable from './StudentPerformanceTable';
import WorkspaceThemeToggle from './WorkspaceThemeToggle';
import useWorkspaceTheme from './useWorkspaceTheme';
import './InstructorDashboard.css';

const SECTION_COPY = {
  overview: ['Command Overview', 'Training operations at a glance.'],
  students: ['Student Roster', 'Review trainee performance and simulation telemetry.'],
  scenario: ['Scenario Builder', 'Configure environmental conditions and simulation pass criteria.'],
  records: ['Assessment Records', 'Review results from completed vessel simulations.'],
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const fetchInstructorDashboard = async () => {
  const response = await fetch(`${API_BASE}/api/instructor/dashboard`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || ''}` },
  });
  if (!response.ok) throw new Error(response.status === 401 ? 'Your session expired. Please sign in again.' : 'Unable to load instructor data.');
  return response.json();
};

const InstructorDashboard = () => {
  const navigate = useNavigate();
  const [isLightMode, toggleTheme] = useWorkspaceTheme();
  const [activeSection, setActiveSection] = useState('overview');
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [notice, setNotice] = useState('');
  const [dashboard, setDashboard] = useState({ students: [], scenarios: [], assessments: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const username = localStorage.getItem('username') || 'Instructor';
  const role = (localStorage.getItem('role') || '').toLowerCase();
  const { students, scenarios, assessments } = dashboard;
  const pendingReviews = students.filter((student) => student.status === 'Needs review').length;
  const averageScore = assessments.length
    ? Math.round(assessments.reduce((sum, record) => sum + record.score, 0) / assessments.length)
    : 0;
  const records = useMemo(() => assessments.map((record) => ({
    ...record,
    student: students.find((student) => student.studentId === record.studentId) || {
      studentId: record.studentId,
      name: record.student,
      finalHealth: record.finalHealth,
      timeTaken: record.timeSeconds,
      maxHeel: record.maxHeel,
      collisions: record.collisions,
      history: [],
    },
  })), [assessments, students]);

  const refreshDashboard = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setDashboard(await fetchInstructorDashboard());
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchInstructorDashboard()
      .then((data) => { if (active) setDashboard(data); })
      .catch((error) => { if (active) setLoadError(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const navigateSection = (section) => {
    setActiveSection(section);
    setSearch('');
    document.querySelector('.instructor-content-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3500);
  };
  const logout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('access_token');
    navigate('/');
  };

  if (role !== 'instructor' && role !== 'admin') {
    return (
      <div className="instructor-page instructor-workspace-layout theme-dark">
        <section className="instructor-access-panel">
          <p className="instructor-eyebrow">RESTRICTED WORKSPACE</p>
          <h1>Instructor access required</h1>
          <p>Sign in with an instructor account to open simulation operations.</p>
          <button className="instructor-button primary" type="button" onClick={() => navigate('/')}>Back to home page</button>
        </section>
      </div>
    );
  }

  const [title, description] = SECTION_COPY[activeSection];
  const metrics = [
    { label: 'Total Active Students', value: students.length, detail: 'Registered student accounts', icon: Users, tone: 'cyan' },
    { label: 'Scenarios Deployed', value: scenarios.length, detail: 'Saved scenario configurations', icon: Ship, tone: 'blue' },
    { label: 'Average Assessment Score', value: `${averageScore}%`, detail: 'Across completed runs', icon: Gauge, tone: 'amber' },
    { label: 'Pending Reviews', value: pendingReviews, detail: 'Failed runs need review', icon: AlertTriangle, tone: 'rose' },
  ];

  return (
    <div className={`instructor-page instructor-workspace-layout ${isLightMode ? '' : 'theme-dark'}`}>
      <InstructorWorkspaceSidebar activeSection={activeSection} onNavigate={navigateSection} onLogout={logout} pendingCount={pendingReviews} username={username} />
      <div className="instructor-shell">
        <header className="instructor-topbar">
          <span className="instructor-breadcrumb">VESSEL SIMULATION <span>/</span> {title.toUpperCase()}</span>
          <div className="instructor-topbar-actions">
            <WorkspaceThemeToggle isLightMode={isLightMode} onToggle={toggleTheme} />
            <span className="instructor-topbar-user"><i /> {username}</span>
          </div>
        </header>
        <main className="instructor-content-scroll">
          {loadError && <p className="instructor-data-note" role="alert">{loadError} <button type="button" onClick={refreshDashboard}>Retry</button></p>}
          {loading && <p className="instructor-data-note" role="status">Loading instructor data…</p>}
          <section className="instructor-heading">
            <div>
              <p className="instructor-eyebrow"><span /> SIMULATION OPERATIONS / INSTRUCTOR</p>
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
            {activeSection === 'overview' && (
              <div className="instructor-quick-actions">
                <button type="button" onClick={() => navigateSection('scenario')}><Ship size={14} /> Create scenario</button>
                <button type="button" onClick={() => navigateSection('students')}><Users size={14} /> View student roster</button>
              </div>
            )}
          </section>

          {activeSection === 'overview' && (
            <>
              <section className="instructor-metrics" aria-label="Simulation operations metrics">
                {metrics.map(({ label, value, detail, icon, tone }) => (
                  <article className="instructor-metric-card" key={label}>
                    <div className="instructor-metric-copy"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
                    <span className={`instructor-metric-icon tone-${tone}`}>{createElement(icon)}</span>
                  </article>
                ))}
              </section>
              <div className="instructor-overview-grid">
                <section className="instructor-panel instructor-activity-panel">
                  <div className="instructor-section-head">
                    <div><p className="instructor-eyebrow">RECENT TELEMETRY</p><h2>Simulation activity</h2></div>
                    <button className="instructor-panel-link" type="button" onClick={() => navigateSection('records')}>Assessment records <span>›</span></button>
                  </div>
                  <div className="instructor-activity-list">
                    {assessments.slice(0, 5).map((item) => (
                      <article className="instructor-activity-row simulation-activity-row" key={`${item.student}-${item.scenario}`}>
                        <span className={`instructor-activity-avatar ${item.result === 'Failed' ? 'is-pending' : ''}`}>{item.student.slice(0, 1)}</span>
                        <div><strong>{item.student}</strong><span>{item.scenario} · {item.score}%</span></div>
                        <span className={`instructor-activity-status ${item.result === 'Passed' ? 'is-complete' : 'is-pending'}`}>{item.result}</span>
                        <time>{new Date(item.date).toLocaleString()}</time>
                      </article>
                    ))}
                    {!loading && assessments.length === 0 && <p className="instructor-empty">No completed simulation assessments yet.</p>}
                  </div>
                </section>
                <section className="instructor-panel instructor-agenda-panel">
                  <div className="instructor-section-head">
                    <div><p className="instructor-eyebrow">SCENARIO LIBRARY</p><h2>Deployed scenarios</h2></div>
                    <button className="instructor-panel-link" type="button" onClick={() => navigateSection('scenario')}>Build scenario <span>›</span></button>
                  </div>
                  <div className="scenario-deployed-list">
                    {scenarios.slice(0, 3).map((scenario) => (
                      <article className="scenario-deployed-row" key={scenario.name}>
                        <span className="scenario-deployed-icon"><Ship size={15} /></span>
                        <div><strong>{scenario.name}</strong><small>{scenario.configuration.weather} · {scenario.configuration.time_of_day}</small></div>
                        <span className="instructor-status status-active">{scenario.status}</span>
                      </article>
                    ))}
                    {!loading && scenarios.length === 0 && <p className="instructor-empty">No scenarios deployed yet.</p>}
                  </div>
                </section>
              </div>
            </>
          )}

          {activeSection === 'students' && (
            <section className="instructor-panel instructor-students-panel">
              <div className="instructor-section-head">
                <div><p className="instructor-eyebrow">TRAINEE PERFORMANCE</p><h2>Student roster</h2></div>
                <label className="instructor-search"><Users size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search students" aria-label="Search students" /></label>
              </div>
              <StudentPerformanceTable students={students} search={search} onSelectStudent={setSelectedStudent} />
              {!loading && students.length === 0 && <p className="instructor-data-note">No student accounts are registered yet.</p>}
            </section>
          )}

          {activeSection === 'scenario' && (
            <>
              <ScenarioBuilder onDeploy={async (configuration) => {
                try {
                  const response = await fetch(`${API_BASE}/api/instructor/scenarios`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${localStorage.getItem('access_token') || ''}`,
                    },
                    body: JSON.stringify(configuration),
                  });
                  const data = await response.json();
                  if (!response.ok) throw new Error(data.detail || 'Scenario deployment failed.');
                  await refreshDashboard();
                  showNotice(`“${data.name}” deployed successfully.`);
                } catch (error) {
                  showNotice(error.message);
                }
              }} />
            </>
          )}

          {activeSection === 'records' && (
            <section className="instructor-panel instructor-students-panel">
              <div className="instructor-section-head">
                <div><p className="instructor-eyebrow">SIMULATION RESULTS</p><h2>Assessment records</h2></div>
                <label className="instructor-search"><Activity size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search records" aria-label="Search assessment records" /></label>
              </div>
              <div className="instructor-table-wrap">
                <table className="instructor-table performance-table">
                  <thead><tr><th>Student</th><th>Scenario</th><th>Score</th><th>Result</th><th>Completed</th><th>Final health</th><th><span className="sr-only">Details</span></th></tr></thead>
                  <tbody>
                    {records.filter((record) => `${record.student.name} ${record.student.studentId} ${record.scenario} ${record.result}`.toLowerCase().includes(search.trim().toLowerCase())).map((record) => (
                      <tr key={record.id}>
                        <td><span className="instructor-student-name"><i>{record.student.name.slice(0, 1)}</i>{record.student.name}</span></td>
                        <td>{record.scenario}</td><td className="telemetry-cell">{record.score}%</td>
                        <td><span className={`instructor-status ${record.result === 'Passed' ? 'status-active' : 'status-overdue'}`}>{record.result}</span></td>
                        <td>{new Date(record.date).toLocaleString()}</td><td className="telemetry-cell">{record.finalHealth}%</td>
                        <td><button className="instructor-panel-link roster-details-button" type="button" onClick={() => setSelectedStudent(record.student)}>Review</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!loading && records.length === 0 && <p className="instructor-empty">No completed assessment records yet.</p>}
              </div>
            </section>
          )}
        </main>
      </div>

      {selectedStudent && (
        <div className="instructor-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedStudent(null); }}>
          <section className="instructor-modal telemetry-review-modal" role="dialog" aria-modal="true" aria-labelledby="student-detail-title">
            <header className="instructor-modal-header">
              <div><p className="instructor-eyebrow">STUDENT TELEMETRY REVIEW</p><h2 id="student-detail-title">{selectedStudent.name}</h2><span className="telemetry-id">{selectedStudent.studentId}</span></div>
              <button className="instructor-icon-button" type="button" aria-label="Close student details" onClick={() => setSelectedStudent(null)}><X /></button>
            </header>
            <div className="telemetry-summary-grid">
              <article><span><Shield size={14} /> FINAL HEALTH</span><strong>{selectedStudent.finalHealth}%</strong></article>
              <article><span><Clock3 size={14} /> TIME TAKEN</span><strong>{selectedStudent.timeTaken == null ? '—' : `${Math.floor(selectedStudent.timeTaken / 60)}:${String(Math.round(selectedStudent.timeTaken % 60)).padStart(2, '0')}`}</strong></article>
              <article><span><Activity size={14} /> MAX HEEL</span><strong>{selectedStudent.maxHeel == null ? '—' : `${Number(selectedStudent.maxHeel).toFixed(1)}°`}</strong></article>
              <article><span><AlertTriangle size={14} /> COLLISIONS</span><strong>{selectedStudent.collisions ?? '—'}</strong></article>
            </div>
            <section className="telemetry-history">
              <h3>Simulation history</h3>
              {(selectedStudent.history || []).map((record) => (
                <article key={`${record.scenario}-${record.date}`}>
                  <div><strong>{record.scenario}</strong><small>{record.date}</small></div>
                  <span className="telemetry-cell">{record.score}%</span>
                  <span className={`instructor-status ${record.result === 'Passed' ? 'status-active' : 'status-overdue'}`}>{record.result}</span>
                </article>
              ))}
            </section>
            <footer className="telemetry-review-footer"><CheckCircle2 size={15} /> Telemetry recorded from completed helm simulations.</footer>
          </section>
        </div>
      )}
      {notice && <div className="instructor-toast" role="status">{notice}</div>}
    </div>
  );
};

export default InstructorDashboard;