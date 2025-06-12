import { createFileRoute } from '@tanstack/react-router';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Settings, Plus } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export const Route = createFileRoute('/journal/memory-zone/')({
  component: MemoryZoneListPage,
});

const memoryZones = [
  {
    id: '1',
    title: 'My Awesome Trip Journal',
    description: 'A shared journal about our latest adventure.',
    members: [
      { avatar: '/avatars/01.png', name: 'BM' },
      { avatar: '/avatars/02.png', name: 'CS' },
      { avatar: '/avatars/03.png', name: 'RP' },
    ]
  },
  {
    id: '2',
    title: 'Project Brainstorm',
    description: 'Ideas and notes for our next big project.',
    members: [
      { avatar: '/avatars/04.png', name: 'U1' },
      { avatar: '/avatars/05.png', name: 'U2' },
    ]
  },
  {
    id: '3',
    title: 'Book Club Notes',
    description: 'Thoughts and discussions on this month\'s book.',
    members: [
      { avatar: '/avatars/01.png', name: 'BM' },
      { avatar: '/avatars/04.png', name: 'U1' },
      { avatar: '/avatars/05.png', name: 'U2' },
      { avatar: '/avatars/03.png', name: 'RP' },
    ]
  },
];

function MemoryZoneListPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Your Memory Zones</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">All your collaborative journals in one place.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create New Zone
        </Button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {memoryZones.map((zone) => (
          <Card key={zone.id} className="group flex flex-col justify-between hover:shadow-lg transition-shadow">
            <Link to="/journal/memory-zone/$zoneId" params={{ zoneId: zone.id }} className="flex flex-col h-full flex-grow">
              <CardHeader className="flex-row items-start justify-between">
                <div>
                  <CardTitle>{zone.title}</CardTitle>
                  <CardDescription>{zone.description}</CardDescription>
                </div>
                
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Settings className="h-5 w-5" />
                      <span className="sr-only">Settings</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>{zone.title} Settings</SheetTitle>
                      <SheetDescription>
                        Manage members and other settings for this memory zone.
                      </SheetDescription>
                    </SheetHeader>
                    <div>
                      <h3 className="text-lg font-medium">Members</h3>
                      <div className="flex -space-x-2 mt-2">
                        {zone.members.map((member, index) => (
                            <Avatar key={index} className="border-2 border-white">
                                <AvatarImage src={member.avatar} />
                                <AvatarFallback>{member.name}</AvatarFallback>
                            </Avatar>
                        ))}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </CardHeader>
              <CardContent className="flex-grow">
                {/* Content can be added here if needed in the future */}
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
} 