import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Layout
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import PushNotificationInitializer from './components/PushNotificationInitializer';

// Public Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

// Protected Pages
import ProfilePage from './pages/ProfilePage';
import PostTaskPage from './pages/PostTaskPage';
import EditTaskPage from './pages/EditTaskPage';
import MyTasksPage from './pages/MyTasksPage';
import TasksPage from './pages/TasksPage';
import MyBidsPage from './pages/MyBidsPage';
import TaskDetailPage from './pages/TaskDetailPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminCategoriesPage from './pages/AdminCategoriesPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminTasksPage from './pages/AdminTasksPage';
import AdminReportsPage from './pages/AdminReportsPage';
import AdminFeesPage from './pages/AdminFeesPage';
import TaskerProfilePage from './pages/TaskerProfilePage';

function App() {
  return (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <PushNotificationInitializer />
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Public Routes */}
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="unauthorized" element={<UnauthorizedPage />} />
            
            {/* Protected Routes */}
            <Route element={<PrivateRoute />}>
              {/* Common Protected Routes */}
              <Route path="profile" element={<ProfilePage />} />
              <Route path="tasks/:taskId" element={<TaskDetailPage />} />
              <Route path="tasker/:taskerId" element={<TaskerProfilePage />} />
            </Route>
            
            {/* Customer Routes */}
            <Route element={<PrivateRoute allowedRoles={['customer', 'admin']} />}>
              <Route path="post-task" element={<PostTaskPage />} />
              <Route path="edit-task/:taskId" element={<EditTaskPage />} />
              <Route path="my-tasks" element={<MyTasksPage />} />
            </Route>
            
            {/* Tasker Routes */}
            <Route element={<PrivateRoute allowedRoles={['tasker', 'admin']} />}>
              <Route path="tasks" element={<TasksPage />} />
              <Route path="my-bids" element={<MyBidsPage />} />
            </Route>
            
            {/* Admin Routes */}
            <Route element={<PrivateRoute allowedRoles={['admin']} />}>
              <Route path="admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="admin/categories" element={<AdminCategoriesPage />} />
            <Route path="admin/users" element={<AdminUsersPage />} />
            <Route path="admin/tasks" element={<AdminTasksPage />} />
            <Route path="admin/reports" element={<AdminReportsPage />} />
            <Route path="admin/fees" element={<AdminFeesPage />} />
            </Route>
            
            {/* Catch all */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
