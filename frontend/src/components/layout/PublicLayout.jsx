import { Outlet } from 'react-router-dom';
import { Header } from './Header.jsx';
import { Footer } from './Footer.jsx';
import { PageTransition } from './PageTransition.jsx';

export function PublicLayout({ headerVariant = 'default' }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header variant={headerVariant} />
      <main id="main-content" className="flex-1">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <Footer />
    </div>
  );
}
