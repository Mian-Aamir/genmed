import { useEffect, useRef } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Search from './pages/Search';
import NotFound from './pages/NotFound';
import Dashboard from './pages/Dashboard';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';

export default function App() {
  const { pathname } = useLocation();
  const main = useRef(null);
  useEffect(() => {
    const titles = { '/': 'Medicine choices, made clearer', '/login': 'Your account', '/search': 'Find medicine alternatives', '/dashboard': 'Your dashboard', '/patient': 'Patient dashboard', '/doctor': 'Doctor dashboard' };
    document.title = `${titles[pathname] || 'Page not found'} | GenMed`;
    main.current?.focus();
    window.scrollTo(0, 0);
  }, [pathname]);
  return <AuthProvider>
    <a className="skip-link" href="#main">Skip to content</a>
    <Navbar />
    <main id="main" ref={main} tabIndex={-1}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/patient" element={<ProtectedRoute role="patient"><PatientDashboard /></ProtectedRoute>} />
        <Route path="/doctor" element={<ProtectedRoute role="doctor"><DoctorDashboard /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute role="patient"><Search /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
    <Footer />
  </AuthProvider>;
}
