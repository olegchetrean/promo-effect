import React, { useState, useCallback, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate, Outlet, useLocation } from 'react-router-dom';
import Login from './components/Login';
import LandingPage from './components/LandingPage';
import DashboardLayout from './components/DashboardLayout';
import MainDashboard from './components/MainDashboard';
import BookingsList from './components/BookingsList';
import BookingDetail from './components/BookingDetail';
import TrackingView from './components/TrackingView';
import PriceCalculator from './components/PriceCalculator';
import EmailParserAssistant from './components/EmailParserAssistant';
import ClientsList from './components/ClientsList';
import InvoicesList from './components/InvoicesList';
import ReportsPage from './components/ReportsPage';
import AdminSettingsPage from './components/AdminSettingsPage';
import UserProfile from './components/UserProfile';
import { User, Booking } from './types';
import { ToastProvider } from './components/ui/Toast';

// Helper component to update document title and handle external script awareness
const RouteObserver = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let title = 'Promo-Efect Logistics';

    if (path.includes('/dashboard/bookings')) title = 'Rezervări | Promo-Efect';
    else if (path.includes('/dashboard/tracking')) title = 'Urmărire Container | Promo-Efect';
    else if (path.includes('/dashboard/calculator')) title = 'Calculator Preț | Promo-Efect';
    else if (path.includes('/dashboard/clients')) title = 'Clienți | Promo-Efect';
    else if (path.includes('/dashboard/invoices')) title = 'Facturi | Promo-Efect';
    else if (path.includes('/dashboard/reports')) title = 'Rapoarte | Promo-Efect';
    else if (path.includes('/dashboard/adminSettings')) title = 'Setări Admin | Promo-Efect';
    else if (path.includes('/dashboard/userProfile')) title = 'Profil Utilizator | Promo-Efect';
    else if (path === '/dashboard') title = 'Panou de Control | Promo-Efect';
    else if (path === '/login') title = 'Autentificare | Promo-Efect';

    document.title = title;
    
    // Optional: Dispatch a custom event if the external script listens for it
    window.dispatchEvent(new Event('pushstate'));
    window.scrollTo(0, 0);
  }, [location]);

  return null;
};

const ProtectedRoute = ({ user, children }: { user: User | null, children: React.ReactNode }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  const handleLogin = useCallback((loggedInUser: User) => {
    setUser(loggedInUser);
    navigate('/dashboard');
  }, [navigate]);

  const handleLogout = useCallback(() => {
    setUser(null);
    navigate('/');
  }, [navigate]);

  const handleNewBooking = useCallback((initialData?: Partial<Booking>) => {
    navigate('/dashboard/bookings/new', { state: { initialData } });
  }, [navigate]);

  return (
    <ToastProvider>
      <RouteObserver />
      <Routes>
        <Route path="/" element={<LandingPage onLoginRedirect={() => navigate('/login')} />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute user={user}>
              <DashboardLayout user={user!} onLogout={handleLogout} onNewBooking={handleNewBooking}>
                <Outlet />
              </DashboardLayout>
            </ProtectedRoute>
          }
        >
          <Route index element={<MainDashboard user={user!} />} />
          <Route path="bookings" element={<BookingsList user={user!} />} />
          <Route path="bookings/:bookingId" element={<BookingDetail user={user!} />} />
          <Route path="tracking" element={<TrackingView />} />
          <Route path="calculator" element={<PriceCalculator />} />
          <Route path="emailParser" element={<EmailParserAssistant onBookingCreate={handleNewBooking} />} />
          <Route path="clients" element={<ClientsList />} />
          <Route path="invoices" element={<InvoicesList />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="adminSettings" element={<AdminSettingsPage />} />
          <Route path="userProfile" element={<UserProfile user={user!} />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
};

export default App;