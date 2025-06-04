import ProjectPage from '@/app/project/page';
import { createFileRoute } from '@tanstack/react-router';

// The route path '/journal/project/$projectId' is automatically inferred
// from the file's location and name.
export const Route = createFileRoute('/journal/project/$projectId')({
  component: ProjectRouteComponent,
});

function ProjectRouteComponent() {
  // TanStack Router's code generation should automatically type `projectId` here
  const { projectId } = Route.useParams();
  return <ProjectPage projectId={projectId} />;
} 