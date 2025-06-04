import DiaryPage from "@/app/diary/page";
import { createFileRoute } from "@tanstack/react-router";
import { MantineProvider } from "@mantine/core";

export const Route = createFileRoute("/journal/diary")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <MantineProvider>
        <DiaryPage />
      </MantineProvider>
    </>
  );
}
