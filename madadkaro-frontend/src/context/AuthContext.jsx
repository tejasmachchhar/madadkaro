import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import socketService from '../services/socket';

// Create a context
const AuthContext = createContext();

// Create a provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Check if user is logged in on initial load
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const userInfo = localStorage.getItem('userInfo');
        const token = localStorage.getItem('token');
        
        if (userInfo && token) {
          setCurrentUser(JSON.parse(userInfo));
          // Initialize socket connection with token
          socketService.initializeSocket(token);
        }
      } catch (error) {
        console.error('Failed to load user info:', error);
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    
    checkLoggedIn();
    
    // Cleanup function to disconnect socket when component unmounts
    return () => {
      socketService.disconnectSocket();
    };
  }, []);
  
  // Register a new user
  const register = async (name, email, password, role, phone) => {
    try {
      const { data } = await api.post('/users', {
        name,
        email,
        password,
        role,
        phone,
      });
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('userInfo', JSON.stringify(data));
      setCurrentUser(data);
      
      // Initialize socket connection with token
      socketService.initializeSocket(data.token);
      
      return data;
    } catch (error) {
      throw error.response && error.response.data.message
        ? new Error(error.response.data.message)
        : new Error('An unexpected error occurred');
    }
  };
  
  // Login user
  const login = async (email, password) => {
    try {
      const { data } = await api.post('/users/login', { email, password });
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('userInfo', JSON.stringify(data));
      setCurrentUser(data);
      
      // Initialize socket connection with token
      socketService.initializeSocket(data.token);
      
      return data;
    } catch (error) {
      throw error.response && error.response.data.message
        ? new Error(error.response.data.message)
        : new Error('Invalid email or password');
    }
  };
  
  // Logout user
  const logout = () => {
    // Disconnect socket
    socketService.disconnectSocket();
    
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    setCurrentUser(null);
  };
  
  // Update user profile
  const updateProfile = async (userData) => {
    try {
      const { data } = await api.put('/users/profile', userData);
      
      localStorage.setItem('userInfo', JSON.stringify(data));
      setCurrentUser(data);
      return data;
    } catch (error) {
      throw error.response && error.response.data.message
        ? new Error(error.response.data.message)
        : new Error('Failed to update profile');
    }
  };
  
  // Check if user is authenticated
  const isAuthenticated = () => {
    return currentUser !== null;
  };
  
  // Check if user is a tasker
  const isTasker = () => {
    return currentUser && currentUser.role === 'tasker';
  };
  
  // Check if user is a customer
  const isCustomer = () => {
    return currentUser && currentUser.role === 'customer';
  };
  
  // Check if user is an admin
  const isAdmin = () => {
    return currentUser && currentUser.role === 'admin';
  };
  
  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        login,
        register,
        logout,
        updateProfile,
        isAuthenticated,
        isTasker,
        isCustomer,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Create a custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
}; 