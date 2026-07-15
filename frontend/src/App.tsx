import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Offers from './pages/Offers';
import OfferBuilder from './pages/OfferBuilder';
import Items from './pages/Items';
import ImportData from './pages/ImportData';
import InstalledBasePage from './pages/InstalledBase';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/offers/new" element={<OfferBuilder />} />
          <Route path="/import" element={<ImportData />} />
          <Route path="/items" element={<Items />} />
          <Route path="/installed-base" element={<InstalledBasePage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
