import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import InstructorDashboard from './pages/InstructorDashboard.jsx';
import LoginPage from './pages/LoginPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/instructor" element={<InstructorDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
