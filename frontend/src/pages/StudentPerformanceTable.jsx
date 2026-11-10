const StudentPerformanceTable = ({ students, onSelectStudent, search = '' }) => {
  const query = search.trim().toLowerCase();
  const visibleStudents = students.filter((student) => (
    !query || `${student.name} ${student.studentId} ${student.status} ${student.lastScenario}`.toLowerCase().includes(query)
  ));

  return (
    <div className="instructor-table-wrap">
      <table className="instructor-table student-table performance-table">
        <thead>
          <tr><th>Student</th><th>Student ID</th><th>Last scenario</th><th>Average score</th><th>Simulations</th><th>Status</th><th><span className="sr-only">Details</span></th></tr>
        </thead>
        <tbody>
          {visibleStudents.map((student) => (
            <tr key={student.studentId}>
              <td><span className="instructor-student-name"><i>{student.name.slice(0, 1)}</i>{student.name}</span></td>
              <td className="telemetry-cell">{student.studentId}</td>
              <td>{student.lastScenario}</td>
              <td className="telemetry-cell">{student.averageScore}%</td>
              <td className="telemetry-cell">{student.simulations}</td>
              <td><span className={`instructor-status ${student.status === 'Active' ? 'status-active' : student.status === 'Needs review' ? 'status-overdue' : 'status-on-track'}`}>{student.status}</span></td>
              <td><button className="instructor-panel-link roster-details-button" type="button" onClick={() => onSelectStudent(student)}>View details</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {!visibleStudents.length && <p className="instructor-empty">No students match this search.</p>}
    </div>
  );
};

export default StudentPerformanceTable;
