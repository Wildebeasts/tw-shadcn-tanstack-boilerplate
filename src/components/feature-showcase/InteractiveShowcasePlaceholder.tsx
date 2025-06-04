import React from 'react';
import { cn } from '@/utils/css';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { PlayCircle } from 'lucide-react';

interface InteractiveShowcasePlaceholderProps {
  id?: string;
  title: string;
  description: string;
  ctaText: string;
  ctaLink?: string;
  className?: string;
  glowVariant?: 'default' | 'white';
  children?: React.ReactNode;
}

export const InteractiveShowcasePlaceholder: React.FC<InteractiveShowcasePlaceholderProps> = ({
  id,
  title,
  description,
  ctaText,
  ctaLink,
  className,
  glowVariant = 'default',
  children,
}) => {
  return (
    <section id={id} className={cn("py-16 md:py-24", className)}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="relative rounded-xl p-0.5 group hover:p-[3px] transition-all duration-300 ease-in-out">
          <Card className="relative overflow-hidden rounded-lg shadow-2xl text-center bg-card/80 backdrop-blur-sm border-border/50 p-1">
            <GlowingEffect 
                blur={10} 
                spread={15} 
                variant={glowVariant} 
                glow={true} 
                disabled={false} 
                movementDuration={1}
                className="rounded-lg"
            />
            <CardHeader className="pt-10 md:pt-12">
              <CardTitle className="text-3xl md:text-4xl font-bold tracking-tight text-primary mb-4">
                {title}
              </CardTitle>
              <CardDescription className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                {description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-10 md:pb-12">
              {children && <div className="mb-8 flex justify-center items-center text-muted-foreground">{children}</div>}
              <Button asChild size="lg" className="group/button ">
                {ctaLink ? (
                  <a href={ctaLink} target="_blank" rel="noopener noreferrer">
                    <PlayCircle className="w-6 h-6 mr-3 transition-transform group-hover/button:scale-110" />
                    {ctaText}
                  </a>
                ) : (
                  <button type="button">
                    <PlayCircle className="w-6 h-6 mr-3 transition-transform group-hover/button:scale-110" />
                    {ctaText}
                  </button>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

 