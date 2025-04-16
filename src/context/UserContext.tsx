import { createContext, useContext, ReactNode, useState } from 'react';

// Define types for user metrics
export interface UserMetrics {
  utilization: {
    utilization_rate: number;
    total_open_tasks: number;
    stale_tasks: number;
  };
  timeliness: {
    timeliness_rate: string;
    on_time_tasks: number;
    total_tasks: number;
  };
  completion: {
    avg_completion_time: number;
    total_completed_tasks: number;
  };
  aging: {
    avg_days_overdue: number;
    total_overdue_tasks: number;
  };
}

// Define User interface
export interface User {
  id: string;
  full_name: string;
  email: string;
  role?: string;
  status?: string;
}

// Define the context shape
interface UserContextType {
  selectedUserId: string | null;
  setSelectedUserId: (id: string | null) => void;
  selectedUser: User | null;
  setSelectedUser: (user: User | null) => void;
  userMetrics: UserMetrics | null;
  setUserMetrics: (metrics: UserMetrics | null) => void;
}

// Create the context with default values
const UserContext = createContext<UserContextType>({
  selectedUserId: null,
  setSelectedUserId: () => {},
  selectedUser: null,
  setSelectedUser: () => {},
  userMetrics: null,
  setUserMetrics: () => {},
});

// Create a provider component
interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null);

  return (
    <UserContext.Provider value={{ 
      selectedUserId, 
      setSelectedUserId,
      selectedUser,
      setSelectedUser,
      userMetrics,
      setUserMetrics
    }}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook to use the context
export function useUser() {
  return useContext(UserContext);
} 