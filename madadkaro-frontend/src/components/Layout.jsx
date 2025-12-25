import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import BottomNavigation from './BottomNavigation';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow py-8 pt-20 md:pt-20 pb-20 md:pb-8">
        <div className="container mx-auto px-4">
          <Outlet />
        </div>
      </main>
      <Footer />
      <BottomNavigation />
      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
};

export default Layout; 