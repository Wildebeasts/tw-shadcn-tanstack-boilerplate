"use client";
import * as React from "react";
import {
  BookOpen,
  PieChart,
  Home,
  CheckSquare,
  Palette,
  ShoppingBag,
  UserCircle,
  PlusSquare,
  Users,
  // FolderKanban, // Removed as it's used in NavProjects
  // Pencil, // Removed as it's used in NavProjects
  // Trash2, // Removed as it's used in NavProjects
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavSecondary } from "@/components/nav-secondary";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { UserButton, useUser } from "@clerk/clerk-react";
import logoBean from "@/images/logo_bean_journal.png";
import { Link } from "@tanstack/react-router";
import { ThemeShopPage } from '@/routes/theme-shop';
import { getProjectsByUserId, createProject, updateProject, deleteProject } from "@/services/projectService";
import type { Project } from "@/types/supabase";
import { useSupabase } from "@/contexts/SupabaseContext";
import { Button } from "@/components/ui/Button";
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as LabelPrimitive from '@radix-ui/react-label';

const data = {
  user: {
    name: "Soybean",
    email: "soy@bean.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Home",
      url: "/",
      icon: Home,
      isActive: true,
      items: [],
    },
    {
      title: "Calendar",
      url: "/journal",
      icon: BookOpen,
      items: [],
    },
    {
      title: "Diaries",
      url: "/journal/diary",
      icon: PieChart,
      items: [],
    },
    {
      title: "ToDo List",
      url: "/journal/todo",
      icon: CheckSquare,
      items: [],
    },
  ],
  navSecondary: [
    {
      title: "Memory Zones",
      url: "/journal/memory-zone",
      icon: Users,
    }
  ],
  // projects: [ // Will be fetched dynamically
  //   {
  //     name: "Study",
  //     url: "#",
  //     icon: BookOpen,
  //   },
  //   {
  //     name: "Fitness",
  //     url: "#",
  //     icon: PieChart,
  //   },
  //   {
  //     name: "Nature",
  //     url: "#",
  //     icon: Map,
  //   },
  // ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isSignedIn, user } = useUser();
  const supabase = useSupabase();
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = React.useState(true);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = React.useState(false);
  const [newProjectName, setNewProjectName] = React.useState("");
  const [newProjectDescription, setNewProjectDescription] = React.useState("");
  const [newProjectColor, setNewProjectColor] = React.useState("#FFFFFF");

  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<Project | null>(null);
  const [editProjectName, setEditProjectName] = React.useState("");
  const [editProjectDescription, setEditProjectDescription] = React.useState("");
  const [editProjectColor, setEditProjectColor] = React.useState("#FFFFFF");

  React.useEffect(() => {
    if (user?.id && supabase) {
      setIsLoadingProjects(true);
      getProjectsByUserId(supabase, user.id)
        .then((data) => {
          setProjects(data || []);
        })
        .catch(error => {
          console.error("Error fetching projects:", error);
          setProjects([]);
        })
        .finally(() => {
          setIsLoadingProjects(false);
        });
    } else {
      setProjects([]);
      setIsLoadingProjects(false);
    }
  }, [user?.id, supabase]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !user?.id || !supabase) {
      console.error("Project name, user ID, and Supabase client are required.");
      return;
    }
    try {
      const created = await createProject(supabase, {
        user_id: user.id,
        name: newProjectName,
        description: newProjectDescription || undefined,
        color_hex: newProjectColor || undefined,
      });
      if (created) {
        setProjects(prev => [...prev, created]);
        setIsCreateProjectModalOpen(false);
        setNewProjectName("");
        setNewProjectDescription("");
        setNewProjectColor("#FFFFFF");
      } else {
        console.error("Failed to create project.");
      }
    } catch (error) {
      console.error("Error in handleCreateProject:", error);
    }
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setEditProjectName(project.name);
    setEditProjectDescription(project.description || "");
    setEditProjectColor(project.color_hex || "#FFFFFF");
    setIsEditProjectModalOpen(true);
  };

  const handleUpdateProject = async () => {
    if (!editingProject || !editProjectName.trim() || !supabase) {
      console.error("Editing project data is missing, invalid, or Supabase client not available.");
      return;
    }
    try {
      const updated = await updateProject(supabase, editingProject.id!, {
        name: editProjectName,
        description: editProjectDescription || undefined,
        color_hex: editProjectColor || undefined,
      });
      if (updated) {
        setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
        setIsEditProjectModalOpen(false);
        setEditingProject(null);
      } else {
        console.error("Failed to update project.");
      }
    } catch (error) {
      console.error("Error in handleUpdateProject:", error);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!supabase) {
      console.error("Supabase client not available.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this project and all its associated data? This action cannot be undone.")) {
      try {
        const success = await deleteProject(supabase, projectId);
        if (success) {
          setProjects(prev => prev.filter(p => p.id !== projectId));
        } else {
          console.error("Failed to delete project.");
        }
      } catch (error) {
        console.error("Error in handleDeleteProject:", error);
      }
    }
  };

  if (!isSignedIn) {
    return (
      <div className="p-4">
        <p>Please sign in to access settings.</p>
      </div>
    );
  }

  const projectListContent = () => {
    if (!supabase && isSignedIn) {
      return <div className="p-2 text-xs text-center text-gray-500">Initializing Supabase connection...</div>;
    }
    if (isLoadingProjects) {
      return <div className="p-2 text-xs text-center text-gray-500">Loading projects...</div>;
    }
    if (projects.length > 0) {
      return (
        <NavProjects
          projects={projects}
          onEditProject={openEditModal}
          onDeleteProject={handleDeleteProject}
        />
      );
    }
    if (supabase && !isLoadingProjects && projects.length === 0) {
      return (
        <div className="px-4 py-2">
          <p className="text-xs text-center text-gray-500 mb-2">No projects yet.</p>
          <Button
            variant="outline"
            className="w-full text-sm"
            onClick={() => setIsCreateProjectModalOpen(true)}
            disabled={!supabase}
          >
            <PlusSquare size={16} className="mr-2" />
            Create New Project
          </Button>
        </div>
      );
    }
    return null;
  };

  return (
    <Sidebar
      variant="inset"
      {...props}
      className="text-[#1e1742] font-publica-sans dark:text-white"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <img src={logoBean} alt="bean journal" className="w-14 h-14 ml-[-1rem] mr-[-0.4rem]" />
                <div className="grid flex-1 text-left text-lg leading-tight">
                  <span className="truncate font-semibold">bean journal</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <div className="px-2 py-2">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-medium text-[#1e1742]/70 dark:text-white/70">
              Projects
            </h3>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsCreateProjectModalOpen(true)} 
              className="h-7 w-7 text-[#1e1742]/70 dark:text-white/70 hover:bg-muted"
              disabled={!supabase}
            >
              <PlusSquare size={16} />
              <span className="sr-only">Create New Project</span>
            </Button>
          </div>
        </div>
        {projectListContent()}
        {/* <div className="px-2 py-2 mt-4">
          <h3 className="px-2 text-xs font-medium text-[#1e1742]/70 dark:text-white/70">
            Memory Zone
          </h3>
        </div> */}
        <NavSecondary items={data.navSecondary} className="" />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu className="NavUser">
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="user-menu-button w-full">
              <div className="flex items-center gap-3 w-full">
                <UserButton
                  showName
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "h-10 w-10 order-1",
                      userButtonOuterIdentifier:
                        "text-left font-semibold text-base truncate order-2",
                      userButtonBox: "flex w-full items-center gap-3",
                      userButtonTrigger:
                        "flex items-center w-full my-6 pr-12 pl-4",
                    },
                  }}
                  userProfileProps={{
                    appearance: { variables: { colorPrimary: "#99BC85" } },
                  }}
                >
                  <UserButton.MenuItems>
                    <UserButton.Link 
                      href="/journal/user-profile" 
                      label="My Profile"
                      labelIcon={<UserCircle size={16} />}
                    />
                  </UserButton.MenuItems>
                  <UserButton.UserProfilePage
                    label="Theme"
                    url="theme"
                    labelIcon={<Palette size={16} />}
                  >
                    <div className="w-full">
                      <h1 className="text-[1.05rem] font-bold mb-2 border-b pb-4">
                        Theme Settings
                      </h1>
                      <div className="space-y-8 py-4">
                        <div className="border-b pb-6">
                          <h2 className="text-[0.8rem] mb-4 font-medium text-[#212126] dark:text-gray-300">
                            Theme
                          </h2>
                          <div className="flex flex-col gap-4">
                            <button className="h-20 w-full bg-gradient-to-r from-[#E4EFE7] to-[#99BC85] rounded-xl shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-[#9645ff] transition-all hover:scale-105 active:scale-95"></button>
                            <button
                              className="h-20 w-full rounded-xl shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-[#9645ff] transition-all hover:scale-105 active:scale-95 overflow-hidden bg-cover bg-center"
                              style={{
                                backgroundImage:
                                  "url('/images/themes/theme1.jpg')",
                              }}
                            ></button>
                            <button
                              className="h-20 w-full rounded-xl shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-[#9645ff] transition-all hover:scale-105 active:scale-95 overflow-hidden bg-cover bg-center"
                              style={{
                                backgroundImage:
                                  "url('/images/themes/theme2.jpg')",
                              }}
                            ></button>
                          </div>
                        </div>
                        <div className="border-b pb-6">
                          <h2 className="text-[0.8rem] mb-3 font-medium text-[#212126] dark:text-gray-300">
                            Font
                          </h2>
                          <div className="flex space-x-3">
                            <button className="flex-1 py-3 px-4 bg-[#B274FF] text-white rounded-lg shadow-md text-sm font-medium focus:ring-2 focus:ring-offset-2 focus:ring-[#9645ff]">
                              Publica Sans
                            </button>
                            <button className="flex-1 py-3 px-4 bg-[#F5C5FC] text-gray-800 rounded-lg shadow-md text-sm font-medium focus:ring-2 focus:ring-offset-2 focus:ring-[#9645ff]">
                              Roboto
                            </button>
                          </div>
                        </div>
                        <div className="mt-6">
                          <h3 className="text-[0.8rem] mb-3 font-medium text-[#212126] dark:text-gray-300">
                            Font Size
                          </h3>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              A
                            </span>
                            <input
                              type="range"
                              min="1"
                              max="3"
                              step="1"
                              defaultValue="2"
                              className="w-full h-1.5 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer focus:ring-2 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-[#9645ff]"
                            />
                            <span className="text-lg text-gray-500 dark:text-gray-400">
                              A
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </UserButton.UserProfilePage>
                  <UserButton.UserProfilePage
                    label="Shop"
                    url="theme-shop-modal"
                    labelIcon={<ShoppingBag size={16} />}
                  >
                    <ThemeShopPage />
                  </UserButton.UserProfilePage>
                </UserButton>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <DialogPrimitive.Root open={isCreateProjectModalOpen} onOpenChange={setIsCreateProjectModalOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-overlayShow z-50" />
          <DialogPrimitive.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[450px] bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg data-[state=open]:animate-contentShow focus:outline-none z-50">
            <DialogPrimitive.Title className="text-lg font-medium text-[#1e1742] dark:text-white mb-1">
              Create New Project
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Organize your journal entries by creating a new project.
            </DialogPrimitive.Description>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <LabelPrimitive.Root htmlFor="projectName" className="text-right text-sm font-medium text-[#1e1742] dark:text-gray-300">
                  Name
                </LabelPrimitive.Root>
                <input
                  id="projectName"
                  value={newProjectName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProjectName(e.target.value)}
                  className="col-span-3 p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Novel Writing, Vacation 2024"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <LabelPrimitive.Root htmlFor="projectDescription" className="text-right text-sm font-medium text-[#1e1742] dark:text-gray-300">
                  Description
                </LabelPrimitive.Root>
                <textarea
                  id="projectDescription"
                  value={newProjectDescription}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewProjectDescription(e.target.value)}
                  className="col-span-3 p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 h-24"
                  placeholder="Optional: A brief description of your project"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <LabelPrimitive.Root htmlFor="projectColor" className="text-right text-sm font-medium text-[#1e1742] dark:text-gray-300">
                  Color
                </LabelPrimitive.Root>
                <input
                  id="projectColor"
                  type="color"
                  value={newProjectColor}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProjectColor(e.target.value)}
                  className="col-span-3 h-10 w-full p-1 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <DialogPrimitive.Close asChild>
                <button 
                  type="button"
                  onClick={() => setIsCreateProjectModalOpen(false)} 
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md border border-gray-300 dark:border-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  Cancel
                </button>
              </DialogPrimitive.Close>
              <button 
                type="button"
                onClick={handleCreateProject} 
                disabled={!supabase || !newProjectName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-[#99BC85] hover:bg-[#8ab076] rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#99BC85] focus-visible:ring-offset-2 disabled:opacity-50"
              >
                Create Project
              </button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {/* Edit Project Modal */}
      <DialogPrimitive.Root open={isEditProjectModalOpen} onOpenChange={setIsEditProjectModalOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-overlayShow z-50" />
          <DialogPrimitive.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[450px] bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg data-[state=open]:animate-contentShow focus:outline-none z-50">
            <DialogPrimitive.Title className="text-lg font-medium text-[#1e1742] dark:text-white mb-1">
              Edit Project
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Update the details of your project.
            </DialogPrimitive.Description>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <LabelPrimitive.Root htmlFor="editProjectName" className="text-right text-sm font-medium text-[#1e1742] dark:text-gray-300">
                  Name
                </LabelPrimitive.Root>
                <input
                  id="editProjectName"
                  value={editProjectName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditProjectName(e.target.value)}
                  className="col-span-3 p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Novel Writing, Vacation 2024"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <LabelPrimitive.Root htmlFor="editProjectDescription" className="text-right text-sm font-medium text-[#1e1742] dark:text-gray-300">
                  Description
                </LabelPrimitive.Root>
                <textarea
                  id="editProjectDescription"
                  value={editProjectDescription}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditProjectDescription(e.target.value)}
                  className="col-span-3 p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 h-24"
                  placeholder="Optional: A brief description of your project"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <LabelPrimitive.Root htmlFor="editProjectColor" className="text-right text-sm font-medium text-[#1e1742] dark:text-gray-300">
                  Color
                </LabelPrimitive.Root>
                <input
                  id="editProjectColor"
                  type="color"
                  value={editProjectColor}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditProjectColor(e.target.value)}
                  className="col-span-3 h-10 w-full p-1 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <DialogPrimitive.Close asChild>
                <button 
                  type="button"
                  onClick={() => {
                    setIsEditProjectModalOpen(false);
                    setEditingProject(null);
                  }} 
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md border border-gray-300 dark:border-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  Cancel
                </button>
              </DialogPrimitive.Close>
              <button 
                type="button"
                onClick={handleUpdateProject} 
                disabled={!supabase || !editProjectName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-[#99BC85] hover:bg-[#8ab076] rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#99BC85] focus-visible:ring-offset-2 disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </Sidebar>
  );
}
