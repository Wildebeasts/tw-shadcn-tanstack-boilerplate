import {
  Folder,
  Share,
  Trash2,
  Pencil,
  FolderKanban,
} from "lucide-react"
import { Link } from "@tanstack/react-router";
import type { Project } from "@/types/supabase";
import { Route as ProjectRouteDefinition } from "@/routes/journal/project/$projectId";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { DotsHorizontalIcon } from "@radix-ui/react-icons"

export function NavProjects({
  projects,
  onEditProject,
  onDeleteProject
}: {
  projects: Project[];
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
}) {
  const { isMobile } = useSidebar()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarMenu>
        {projects.map((project) => {
          const IconComponent = FolderKanban;
          if (!project.id) return null;

          return (
            <SidebarMenuItem key={project.id}>
              <SidebarMenuButton asChild>
                <Link
                  to={ProjectRouteDefinition.to}
                  params={{ projectId: project.id }}
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  <span>{project.name}</span>
                </Link>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction showOnHover>
                    <DotsHorizontalIcon />
                    <span className="sr-only">More options for {project.name}</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-48"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                >
                  <DropdownMenuItem onSelect={() => {
                    console.log("View project action for", project.name);
                  }}>
                    <Folder className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>View Project</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onSelect={() => onEditProject(project)}>
                    <Pencil className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Edit Project</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem onSelect={() => {}}>
                    <Share className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Share Project</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => onDeleteProject(project.id!)} className="text-red-600 hover:!text-red-600 hover:!bg-red-50 dark:hover:!bg-red-900/50 dark:text-red-500 dark:hover:!text-red-400">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete Project</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
