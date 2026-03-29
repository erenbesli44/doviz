import { Outlet } from 'react-router-dom';
import TopNavBar from './TopNavBar';
import TopAppBar from './TopAppBar';
import BottomNavBar from './BottomNavBar';
import SiteFooter from './SiteFooter';

export default function AppLayout() {
  return (
    <>
      {/* Desktop top nav */}
      <TopNavBar />
      {/* Mobile top bar */}
      <TopAppBar />

      {/* Page content */}
      <main className="mt-24 md:mt-16 px-6 md:px-8 pb-28 md:pb-12 max-w-[1440px] md:mx-auto">
        <Outlet />
        <SiteFooter />
      </main>

      {/* Mobile only */}
      <BottomNavBar />
    </>
  );
}
