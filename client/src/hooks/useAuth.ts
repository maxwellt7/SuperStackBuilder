import { useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { user: clerkUser, isLoaded } = useUser();
  
  // Fetch our app's user data from the backend
  const { data: user, isLoading: isUserLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    enabled: !!clerkUser,
    retry: false,
  });

  return {
    user,
    clerkUser,
    isLoading: !isLoaded || isUserLoading,
    isAuthenticated: !!clerkUser,
  };
}
