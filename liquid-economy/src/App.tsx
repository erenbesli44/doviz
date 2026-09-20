import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import DesignSystem from './pages/DesignSystem';

// ── New pages ──────────────────────────────────────────────────────────────
import Home from './pages/Home';
import SymbolDirectory from './pages/SymbolDirectory';
import SymbolDetail from './pages/SymbolDetail';
import Uzmanlar from './pages/Uzmanlar';
import UzmanlarProfile from './pages/UzmanlarProfile';
import Konular from './pages/Konular';

// ── Kept pages ─────────────────────────────────────────────────────────────
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
          {/* ── Primary routes ───────────────────────────── */}
          <Route index element={<Home />} />
          <Route path="piyasa" element={<SymbolDirectory />} />
          <Route path="piyasa/:slug" element={<SymbolDetail />} />
          <Route path="uzmanlar" element={<Uzmanlar />} />
          <Route path="uzmanlar/:slug" element={<UzmanlarProfile />} />
          <Route path="konular" element={<Konular />} />
          <Route path="haberler" element={<Haberler />} />
          <Route path="haberler/:videoId" element={<NewsDetail />} />

          {/* ── Retired category pages → /piyasa with filter ─ */}
          <Route path="doviz"               element={<Navigate to="/piyasa?kategori=fx"        replace />} />
          <Route path="doviz-kurlari"       element={<Navigate to="/piyasa?kategori=fx"        replace />} />
          <Route path="altin"               element={<Navigate to="/piyasa?kategori=gold"      replace />} />
          <Route path="altin-fiyatlari"     element={<Navigate to="/piyasa?kategori=gold"      replace />} />
          <Route path="kapalicarsi"         element={<Navigate to="/piyasa?kategori=gold"      replace />} />
          <Route path="endeksler"           element={<Navigate to="/piyasa?kategori=index"     replace />} />
          <Route path="endeks"              element={<Navigate to="/piyasa?kategori=index"     replace />} />
          <Route path="amerika-borsasi"     element={<Navigate to="/piyasa?kategori=index"     replace />} />
          <Route path="emtialar"            element={<Navigate to="/piyasa?kategori=commodity" replace />} />
          <Route path="emtia-fiyatlari"     element={<Navigate to="/piyasa?kategori=commodity" replace />} />
          <Route path="kripto"              element={<Navigate to="/piyasa?kategori=crypto"    replace />} />
          <Route path="kripto-paralar"      element={<Navigate to="/piyasa?kategori=crypto"    replace />} />
          <Route path="analiz"              element={<Navigate to="/"                          replace />} />

          {/* ── Static / content pages ───────────────────── */}
          <Route path="metodoloji"      element={<Methodology />} />
          <Route path="veri-kaynaklari" element={<DataSources />} />
          <Route path="hakkimizda"      element={<About />} />
          <Route path="iletisim"        element={<Contact />} />
          <Route path="yasal-uyari"     element={<LegalNotice />} />
          <Route path="sozluk"          element={<Glossary />} />

          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Dev-only: design system preview — no AppLayout */}
        <Route path="_/design-system" element={<DesignSystem />} />
      </Routes>
    </BrowserRouter>
  );
}
