import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api';

export const useAuth = () => {
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      apiClient.login(email, password),
    onSuccess: (data) => {
      apiClient.setToken(data.token);
      // Invalidate so the query re-fetches from getCurrentUser() -> /api/user/me
      // which returns the DB user with proper top-level name, role, etc.
      // Do NOT setQueryData with the raw Supabase auth user — it has a different shape.
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: ({ email, password, name, role }: { email: string; password: string; name: string; role: string }) =>
      apiClient.register(email, password, name, role),
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiClient.logout(),
    onSuccess: () => {
      apiClient.clearToken();
      queryClient.clear();
    },
  });

  const userQuery = useQuery({
    queryKey: ['user'],
    queryFn: () => apiClient.getCurrentUser(),
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('token'),
    retry: false,
  });

  return {
    user: userQuery.data,
    isLoading: userQuery.isLoading,
    isAuthenticated: !!userQuery.data,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
  };
};