import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Markets from './pages/Markets';
import Currency from './pages/Currency';
import Gold from './pages/Gold';
import Indexes from './pages/Indexes';
import Commodities from './pages/Commodities';
import Crypto from './pages/Crypto';
import Kapalicarsi from './pages/Kapalicarsi';
import USMarkets from './pages/USMarkets';
import SymbolDirectory from './pages/SymbolDirectory';
import SymbolDetail from './pages/SymbolDetail';
import Methodology from './pages/Methodology';
import DataSources from './pages/DataSources';
import About from './pages/About';
import Contact from './pages/Contact';
import LegalNotice from './pages/LegalNotice';
import Glossary from './pages/Glossary';
import NewsDetail from './pages/NewsDetail';
import Haberler from './pages/Haberler';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index      element={<Markets />}     />
          <Route path="doviz"     element={<Currency />}    />
          <Route path="doviz-kurlari" element={<Currency />} />
          <Route path="altin"     element={<Gold />}        />
          <Route path="altin-fiyatlari" element={<Gold />} />
          <Route path="kapalicarsi" element={<Kapalicarsi />} />
          <Route path="endeksler" element={<Indexes />}     />
          <Route path="endeks" element={<Indexes />} />
          <Route path="amerika-borsasi" element={<USMarkets />} />
          <Route path="emtialar"  element={<Commodities />} />
          <Route path="emtia-fiyatlari" element={<Commodities />} />
          <Route path="kripto"  element={<Crypto />} />
          <Route path="kripto-paralar" element={<Crypto />} />
          <Route path="piyasa" element={<SymbolDirectory />} />
          <Route path="piyasa/:slug" element={<SymbolDetail />} />
          <Route path="metodoloji" element={<Methodology />} />
          <Route path="veri-kaynaklari" element={<DataSources />} />
          <Route path="hakkimizda" element={<About />} />
          <Route path="iletisim" element={<Contact />} />
          <Route path="yasal-uyari" element={<LegalNotice />} />
          <Route path="sozluk" element={<Glossary />} />
          <Route path="haberler" element={<Haberler />} />
          <Route path="haberler/:videoId" element={<NewsDetail />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
