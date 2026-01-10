import { useEffect } from 'react';
import usePushNotifications from '../hooks/usePushNotifications';

/**
 * Component to initialize push notifications
 * This component must be inside the Router and AuthProvider to work properly
 */
const PushNotificationInitializer = () => {
  // Use the hook inside the component
  usePushNotifications();

  // This component doesn't render anything visible
  return null;
};

export default PushNotificationInitializer;
