import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import { 
  login as loginAction, 
  register as registerAction, 
  logout as logoutAction,
  updateProfile as updateProfileAction,
  selectCurrentUser,
  selectIsAuthenticated,
  selectIsCustomer,
  selectIsTasker,
  selectIsAdmin,
  selectUserLoading,
  selectUserError,
} from '../store/slices/userSlice';

/**
 * Custom hook for authentication
 * @returns {Object} Authentication methods and state
 */
export const useAuth = () => {
  const dispatch = useDispatch();
  
  // Selectors
  const currentUser = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isCustomer = useSelector(selectIsCustomer);
  const isTasker = useSelector(selectIsTasker);
  const isAdmin = useSelector(selectIsAdmin);
  const loading = useSelector(selectUserLoading);
  const error = useSelector(selectUserError);
  
  // Authentication actions
  const login = useCallback(
    (email, password) => dispatch(loginAction({ email, password })),
    [dispatch]
  );
  
  const register = useCallback(
    (userData) => dispatch(registerAction(userData)),
    [dispatch]
  );
  
  const logout = useCallback(
    () => dispatch(logoutAction()),
    [dispatch]
  );
  
  const updateProfile = useCallback(
    (userData) => dispatch(updateProfileAction(userData)),
    [dispatch]
  );
  
  return {
    // State
    currentUser,
    isAuthenticated,
    isCustomer,
    isTasker,
    isAdmin,
    loading,
    error,
    
    // Actions
    login,
    register,
    logout,
    updateProfile,
  };
}; 