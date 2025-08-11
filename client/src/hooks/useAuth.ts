import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export function useAuth() {
  const token = localStorage.getItem('authToken');
  const queryClient = useQueryClient();
  
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      if (!token) return null as any;
      const response = await apiRequest("GET", "/api/auth/user");
      if (!response.ok) return null as any;
      return response.json();
    },
    retry: false,
    enabled: !!token,
  });

  const login = (token: string) => {
    localStorage.setItem('authToken', token);
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    window.location.href = '/';
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
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
