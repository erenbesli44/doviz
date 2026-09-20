import { Outlet } from 'react-router-dom';
import { usePageTracking } from '../../hooks/usePageTracking';
import TopNavBar from './TopNavBar';
import BottomNavBar from './BottomNavBar';
import SiteFooter from './SiteFooter';

export default function AppLayout() {
  usePageTracking();

  return (
    <>
      {/* Single top nav — responsive (hides links below md) */}
      <TopNavBar />

      {/* Page content
          mt-14 = 56px, matches the new nav height.
          New full-bleed pages add class="page-full-bleed" to their root div;
          the :has() selector removes horizontal padding for them.
          Old kept pages (Haberler, Methodology, etc.) get px-4 md:px-8.    */}
      <main className="mt-14 pb-24 md:pb-12 max-w-[1440px] md:mx-auto">
        <div className="px-4 md:px-8 [&:has(.page-full-bleed)]:px-0 [&:has(.page-full-bleed)]:md:px-0">
          <Outlet />
          <SiteFooter />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNavBar />
    </>
  );
}
