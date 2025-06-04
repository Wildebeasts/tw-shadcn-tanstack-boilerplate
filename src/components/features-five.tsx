import { Button } from '@/components/ui/Button'
import { CalendarCheck, ChevronRight, Target } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import appScreen from '@/images/feature1.png'

export default function FeaturesSection() {
    return (
        <section>
            <div className="py-24">
                <div className="mx-auto w-full max-w-5xl px-6">
                    <div className="grid gap-12 md:grid-cols-5">
                        <div className="md:col-span-2">
                            <h2 className="text-foreground text-balance text-4xl font-semibold">Unlock Insights with Bean Journal's AI</h2>
                            <Button
                                className="mt-8 pr-2"
                                variant="outline"
                                asChild>
                                <Link to="/">
                                    Learn more
                                    <ChevronRight className="size-4 opacity-50" />
                                </Link>
                            </Button>
                        </div>

                        <div className="space-y-6 md:col-span-3 md:space-y-10">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Target className="size-5" />
                                    <h3 className="text-foreground text-lg font-semibold">AI Mood Detection</h3>
                                </div>
                                <p className="mt-3 text-balance">Understand your emotional patterns with our intelligent mood detection. Gain insights into your well-being effortlessly.</p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2">
                                    <CalendarCheck className="size-5" />
                                    <h3 className="text-foreground text-lg font-semibold">AI Journal to Video</h3>
                                </div>
                                <p className="mt-3 text-balance">Transform your journal entries into engaging video summaries. Relive your moments and share your stories in a new dynamic way.</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative -mx-12 mt-16 px-12">
                        <div className="bg-background rounded-(--radius) relative mx-auto overflow-hidden border border-transparent shadow-lg shadow-black/10 ring-1 ring-black/10">
                            <img
                                src={appScreen}
                                alt="app screen"
                                width="2880"
                                height="1842"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
