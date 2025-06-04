import DiaryPage from '@/app/diary/page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/journal/diary')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <DiaryPage />
    </>
  )
}
