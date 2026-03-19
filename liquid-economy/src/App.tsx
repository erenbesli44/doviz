import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Markets from './pages/Markets';
import Currency from './pages/Currency';
import Gold from './pages/Gold';
import Indexes from './pages/Indexes';
import Commodities from './pages/Commodities';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index      element={<Markets />}     />
          <Route path="doviz"     element={<Currency />}    />
          <Route path="altin"     element={<Gold />}        />
          <Route path="endeksler" element={<Indexes />}     />
          <Route path="emtialar"  element={<Commodities />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
