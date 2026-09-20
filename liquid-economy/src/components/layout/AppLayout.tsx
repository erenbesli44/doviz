import { Outlet } from 'react-router-dom';
import { usePageTracking } from '../../hooks/usePageTracking';
import TopNavBar from './TopNavBar';
import BottomNavBar from './BottomNavBar';
import SiteFooter from './SiteFooter';
import ScrollManager from './ScrollManager';

export default function AppLayout() {
  usePageTracking();

  return (
    <>
      <ScrollManager />
      <TopNavBar />

      {/* pt-14 clears the fixed masthead; pb-24 clears the mobile tab bar. */}
      <div className="mx-auto max-w-[1120px] px-4 pt-14 pb-24 md:px-6 md:pb-10">
        <main id="icerik" className="pt-6 md:pt-8">
          <Outlet />
        </main>
        <SiteFooter />
      </div>

      <BottomNavBar />
    </>
  );
}
