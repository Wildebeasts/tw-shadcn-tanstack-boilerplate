import { useAuth, useClerk } from "@clerk/clerk-react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

// Public routes that don't require authentication
const publicRoutes = [
  "/",
  "/sign-in",
  "/sign-in/sso-callback",
  "/sign-up",
  "/sign-up/continue",
  "/pricing",
  "/features",
  "/blog",
  "/about"
];

// Get environment variables with fallbacks
const getEnvVar = (key: string, fallback: string): string => {
  const value = import.meta.env[`VITE_CLERK_${key}`];
  return value || fallback;
};

/**
 * This is our middleware-like functionality for TanStack Router
 * It handles authentication and route protection at the client level
 */
export function useAuthProtection() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const clerk = useClerk();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const searchParams = new URLSearchParams(routerState.location.search);
  const returnUrl = searchParams.get('redirect') || "/journal";
  
  useEffect(() => {
    if (!isLoaded) return;
    
    // 1. Check if the current route is public
    const isPublicRoute = publicRoutes.some(route => 
      currentPath === route || currentPath.startsWith(`${route}/`)
    );
    
    // 2. Protect non-public routes (middleware-like functionality)
    if (!isPublicRoute && !isSignedIn) {
      // If not authenticated and trying to access a protected route, 
      // redirect to login with the intended destination
      navigate({ 
        to: getEnvVar("SIGN_IN_URL", "/sign-in"), 
        search: { redirect: currentPath } 
      });
      return;
    }
    
    // 3. Handle authenticated users on auth pages
    if (isSignedIn) {
      // If user is already signed in and on an auth page, redirect to destination
      if (currentPath === "/sign-in" || currentPath === "/sign-up" || currentPath === "/sign-up/continue") {
        navigate({ to: getEnvVar("AFTER_SIGN_IN_URL", "/journal") });
        return;
      }
    }
  }, [isLoaded, isSignedIn, currentPath, navigate, userId]);
  
  // Expose the auth state for components to use
  return {
    isLoaded,
    isSignedIn,
    userId,
    signOut: clerk.signOut,
    returnUrl
  };
}

/**
 * Helper for components to use Clerk auth URLs consistently
 */
export function useAuthUrls() {
  return {
    signInUrl: getEnvVar("SIGN_IN_URL", "/sign-in"),
    signUpUrl: getEnvVar("SIGN_UP_URL", "/sign-up"),
    signUpContinueUrl: getEnvVar("SIGN_UP_CONTINUE_URL", "/sign-up/continue"),
    afterSignInUrl: getEnvVar("AFTER_SIGN_IN_URL", "/journal"),
    afterSignUpUrl: getEnvVar("AFTER_SIGN_UP_URL", "/sign-up/continue")
  };
} 