import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/css"; // Assuming you have a cn utility

interface FeatureShowcaseCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  imageUrl?: string;
  imageAlt?: string;
  tags?: string[];
  align?: 'left' | 'center' | 'right';
  className?: string;
  children?: React.ReactNode; // For more complex content
}

export const FeatureShowcaseCard: React.FC<FeatureShowcaseCardProps> = ({
  title,
  description,
  icon,
  imageUrl,
  imageAlt = 'Feature image',
  tags,
  align = 'left',
  className,
  children,
}) => {
  const textAlignClass = {
    left: 'text-left',
    center: 'text-center items-center',
    right: 'text-right items-end',
  }[align];

  return (
    <Card className={cn("overflow-hidden", className)}>
      {imageUrl && (
        <div className="aspect-video overflow-hidden">
          <img
            src={imageUrl}
            alt={imageAlt}
            className="object-cover w-full h-full"
          />
        </div>
      )}
      <CardHeader className={cn("flex flex-col", textAlignClass)}>
        {icon && <div className={cn("mb-3 h-10 w-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary", align === 'center' ? 'mx-auto' : '')}>{icon}</div>}
        <CardTitle className="text-xl lg:text-2xl font-semibold">{title}</CardTitle>
        <CardDescription className={cn("mt-2 text-base text-muted-foreground", align === 'center' ? 'max-w-md mx-auto' : 'max-w-none')}>{description}</CardDescription>
      </CardHeader>
      <CardContent className={cn("flex flex-col", textAlignClass)}>
        {children && <div className="mb-4">{children}</div>}
        {tags && tags.length > 0 && (
          <div className={cn("flex flex-wrap gap-2 mt-auto pt-4", align === 'center' ? 'justify-center' : '')}>
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 