import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter, useNavigate } from "@tanstack/react-router";
import { ClerkProvider } from '@clerk/clerk-react'
import { Toaster } from 'sonner';
import { HelmetProvider } from 'react-helmet-async';

//theme provider from shared components (e.g. for light/dark mode)
import { ThemeProvider as ShadThemeProvider } from "@/components/shared/ThemeProvider";

// Import your custom ThemeProvider for application themes
import { ThemeProvider as CustomThemeProvider } from './contexts/ThemeContext';

// Import the Supabase Provider
import { SupabaseProvider } from './contexts/SupabaseContext';

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

//global styles
import "./index.css";
import "./app.css";

// Get your Clerk publishable key from environment variable
// You'll need to add this to your .env file
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
	throw new Error("Missing Clerk publishable key");
}

// Create a new router instance
// Pass the router tree and context (including Clerk config)
const router = createRouter({
	routeTree,
	context: {
		auth: undefined!, // Initialize auth context, will be overridden
	},
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
	// Define the auth context shape
	interface RouterContext {
		auth: { publishableKey: string; routerPush: (to: string) => void; routerReplace: (to: string) => void };
	}
}

// This component will wrap the Outlet in the root route
export function ClerkAndThemeProvider({ children }: { children: React.ReactNode }) {
	const navigate = useNavigate();

	return (
		<ClerkProvider 
			publishableKey={CLERK_PUBLISHABLE_KEY}
			// Pass the navigate function to Clerk
			routerPush={(to) => navigate({ to })}
			routerReplace={(to) => navigate({ to, replace: true })}
			// Explicitly define fallback URLs
			signInFallbackRedirectUrl="/journal" // Where to go after successful sign-in
			signUpFallbackRedirectUrl="/sign-up/continue" // Where to go if sign-up needs completion (e.g., from SSO)
			// afterSignInUrl="/journal" // Deprecated, use fallback/force instead
			// afterSignUpUrl="/sign-up/continue" // Deprecated, use fallback/force instead
		>
			<ShadThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
				<SupabaseProvider>
					{children}
					<Toaster />
				</SupabaseProvider>
			</ShadThemeProvider>
		</ClerkProvider>
	);
}

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(
		<StrictMode>
			<HelmetProvider>
				<CustomThemeProvider>
					<RouterProvider router={router} />
				</CustomThemeProvider>
			</HelmetProvider>
		</StrictMode>,
	);
}
