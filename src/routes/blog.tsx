import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/blog')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <h1>Blog</h1>
    </div>
  )
}
