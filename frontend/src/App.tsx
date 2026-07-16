import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import SplashScreen from './components/SplashScreen';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Offers from './pages/Offers';
import OfferBuilder from './pages/OfferBuilder';
import ImportData from './pages/ImportData';
import NotFound from './pages/NotFound';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('wa_auth') === '1');
  const [showSplash, setShowSplash] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  const handleLogin = useCallback(() => {
    localStorage.setItem('wa_auth', '1');
    setIsLoggedIn(true);
    setShowSplash(true);
    setSplashDone(false);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('wa_auth');
    setIsLoggedIn(false);
    setSplashDone(false);
  }, []);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
    setSplashDone(true);
  }, []);

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (showSplash && !splashDone) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout onLogout={handleLogout} />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/offers/new" element={<OfferBuilder />} />
          <Route path="/import" element={<ImportData />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
