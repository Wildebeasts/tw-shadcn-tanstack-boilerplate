import { Outlet, createFileRoute, useRouterState, Link } from "@tanstack/react-router";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/app-sidebar";
//import { ModeToggle } from "@/components/shared/ModeToggle";
import { useEffect, useState, useMemo } from 'react';
import '../journal-theme.css'; 
import { getProjectById } from "@/services/projectService";
import { useSession } from "@clerk/clerk-react";
import { createClerkSupabaseClient } from "@/utils/supabaseClient";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Project } from "@/types/supabase";


// Create a file route for the journal section
export const Route = createFileRoute("/journal")({
  component: JournalLayout
});

function JournalLayout() {
  // const { user } = useUser(); // Removed unused user variable
  const { session } = useSession();
  // const params = useParams({ from: Route.id }); // Removed unused params
  const routerState = useRouterState();
  const [projectName, setProjectName] = useState<string | null>(null);
  const [isLoadingProjectName, setIsLoadingProjectName] = useState(false);

  const activeSupabaseClient: SupabaseClient | null = useMemo(() => {
    if (session) {
      return createClerkSupabaseClient(() => session.getToken());
    }
    return null;
  }, [session]);

  // const isProjectPage = routerState.location.pathname.includes('/journal/projects/');
  // Ensure projectId is correctly extracted. Since Route.id for /journal does not have $projectId, we need to be careful.
  // This component (JournalLayout) is for the /journal route. 
  // If we want to access params for a child route like /journal/projects/$projectId, 
  // those params would typically be accessed within the component for that specific child route.
  // However, routerState.location.pathname can give us the full path.
  let projectId: string | null = null;
  const pathParts = routerState.location.pathname.split('/');
  if (pathParts.length >= 4 && pathParts[1] === 'journal' && pathParts[2] === 'project' && pathParts[3]) {
    projectId = pathParts[3];
  }

  useEffect(() => {
    document.body.classList.add('journal-theme');
    // Optionally add theme class to root div if needed for direct scoping
    // const rootDiv = document.getElementById('root'); // Or use a ref
    // if (rootDiv) rootDiv.classList.add('journal-theme');

    return () => {
      document.body.classList.remove('journal-theme');
      // if (rootDiv) rootDiv.classList.remove('journal-theme');
    };
  }, []);

  useEffect(() => {
    if (projectId && activeSupabaseClient) {
      setIsLoadingProjectName(true);
      getProjectById(activeSupabaseClient, projectId)
        .then((project: Project | null) => {
          if (project) {
            setProjectName(project.name);
          } else {
            setProjectName(null);
          }
        })
        .catch(error => {
          console.error("Error fetching project name for breadcrumb:", error);
          setProjectName(null);
        })
        .finally(() => {
          setIsLoadingProjectName(false);
        });
    } else {
      setProjectName(null); // Reset if no longer on a project page or no projectId
    }
  }, [projectId, activeSupabaseClient]);

  const getBreadcrumbPath = () => {
    const path = routerState.location.pathname;
    if (path.startsWith("/journal/project/") && projectId) {
      return (
        <>
          <BreadcrumbItem className="hidden md:block">
            {/* This Link should ideally point to a general projects listing page if one exists */}
            <BreadcrumbLink asChild className="text-[#2f2569] dark:text-white interactive">
              <Link to="/journal">Projects</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block text-[#2f2569]/50 dark:text-white/50" />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-[#2f2569] dark:text-white">
              {isLoadingProjectName ? "Loading..." : projectName || "Project Details"}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </>
      );
    } else if (path === "/journal/diary") {
      return (
        <BreadcrumbItem>
          <BreadcrumbPage className="text-[#2f2569] dark:text-white">Diaries</BreadcrumbPage>
        </BreadcrumbItem>
      );
    } else if (path === "/journal/todo") {
      return (
        <BreadcrumbItem>
          <BreadcrumbPage className="text-[#2f2569] dark:text-white">ToDo List</BreadcrumbPage>
        </BreadcrumbItem>
      );
    } else if (path === "/journal/user-profile") {
      return (
        <BreadcrumbItem>
          <BreadcrumbPage className="text-[#2f2569] dark:text-white">User Profile</BreadcrumbPage>
        </BreadcrumbItem>
      );
    }
    // Default for /journal or other sub-pages
    return (
      <BreadcrumbItem>
        <BreadcrumbPage className="text-[#2f2569] dark:text-white">Overview</BreadcrumbPage>
      </BreadcrumbItem>
    );
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-white dark:bg-transparent font-mono">
        <header className="flex h-16 items-center gap-2 rounded-t-lg">
          <div className="flex items-center justify-between w-full px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger 
                className="-ml-1 text-[#2f2569] dark:text-white z-50" 
                aria-label="Toggle sidebar"
              />
              <Separator orientation="vertical" className="mr-2 h-4 bg-[#2f2569]/20 dark:bg-white/20" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink asChild className="text-[#2f2569] dark:text-white interactive">
                       <Link to="/journal">Bean Journal</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block text-[#2f2569]/50 dark:text-white/50" />
                  {getBreadcrumbPath()}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            {/* <div className="flex items-center gap-2">
              <div className="text-[#2f2569] dark:text-white">
                <ModeToggle />
              </div>
            </div> */}
          </div>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
} 