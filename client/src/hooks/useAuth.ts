import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export function useAuth() {
  const token = localStorage.getItem('authToken');
  
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      if (!token) return null;
      
      const response = await apiRequest("GET", "/api/auth/user");
      if (!response.ok) return null;
      return response.json();
    },
    retry: false,
    enabled: !!token,
  });

  const login = (token: string) => {
    localStorage.setItem('authToken', token);
    window.location.reload();
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    window.location.href = '/login';
  };

  return {
    user,
    isLoading: isLoading && !!token,
    isAuthenticated: !!user && !!token,
    login,
    logout,
  };
}
