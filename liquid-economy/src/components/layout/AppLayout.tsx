import { Outlet } from 'react-router-dom';
import TopNavBar from './TopNavBar';
import TopAppBar from './TopAppBar';
import BottomNavBar from './BottomNavBar';
import FAB from './FAB';

export default function AppLayout() {
  return (
    <>
      {/* Desktop top nav */}
      <TopNavBar />
      {/* Mobile top bar */}
      <TopAppBar />

      {/* Page content */}
      {/* mt-32 offsets mobile fixed header (~pt-12+pb-4+h1 ≈ 8rem)
          md:mt-16 offsets desktop nav (h-16)
          pb-32 leaves space for mobile bottom nav + FAB
          md:pb-12 just standard desktop padding */}
      <main className="mt-24 md:mt-16 px-6 md:px-8 pb-32 md:pb-12 max-w-[1440px] md:mx-auto">
        <Outlet />
      </main>

      {/* Mobile only */}
      <BottomNavBar />
      <FAB />
    </>
  );
}
