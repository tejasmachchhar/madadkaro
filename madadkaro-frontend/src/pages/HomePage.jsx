import GuestHomePage from './GuestHomePage';
import CustomerHomePage from './CustomerHomePage';
import TaskerHomePage from './TaskerHomePage';
import { useAuth } from '../hooks/useAuth';

const HomePage = () => {
  const { isAuthenticated, isCustomer, isTasker } = useAuth();
  
  if (!isAuthenticated) {
    return <GuestHomePage />;
  }
  
  if (isCustomer) {
    return <CustomerHomePage />;
  }
  
  if (isTasker) {
    return <TaskerHomePage />;
  }
  
  // Fallback to guest page for other roles (e.g., admin)
  return <GuestHomePage />;
};

export default HomePage; 