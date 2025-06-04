import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/css';
import { Button } from '@/components/ui/Button';
import { ArrowRight } from 'lucide-react'; // Assuming you have lucide-react

interface AlternatingFeatureSectionProps {
  id?: string;
  title: string;
  description: string;
  bulletPoints?: string[];
  imageUrl: string;
  imageAlt: string;
  imageSide: 'left' | 'right';
  ctaText?: string;
  ctaLink?: string;
  className?: string;
  children?: React.ReactNode; // For more complex inner content if needed
}

export const AlternatingFeatureSection: React.FC<AlternatingFeatureSectionProps> = ({
  id,
  title,
  description,
  bulletPoints,
  imageUrl,
  imageAlt,
  imageSide,
  ctaText,
  ctaLink,
  className,
  children
}) => {
  const variants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const imageOrderClass = imageSide === 'left' ? 'md:order-1' : 'md:order-2';
  const textOrderClass = imageSide === 'left' ? 'md:order-2' : 'md:order-1';

  return (
    <motion.section
      id={id}
      className={cn("py-16 md:py-24 overflow-hidden", className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={variants}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          {/* Image Column */}
          <div className={cn("relative", imageOrderClass)}>
            <motion.img
              src={imageUrl}
              alt={imageAlt}
              className="rounded-lg shadow-2xl object-cover w-full h-auto aspect-[4/3] md:aspect-auto"
              initial={{ scale: 0.95, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1, transition: { duration: 0.5, delay: 0.2 } }}
              viewport={{ once: true, amount: 0.5 }}
            />
          </div>

          {/* Text Content Column */}
          <div className={cn(textOrderClass)}>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6 text-primary">
              {title}
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-6">
              {description}
            </p>
            {bulletPoints && bulletPoints.length > 0 && (
              <ul className="space-y-3 mb-8">
                {bulletPoints.map((point, index) => (
                  <li key={index} className="flex items-start">
                    <ArrowRight className="w-5 h-5 text-primary mr-3 mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">{point}</span>
                  </li>
                ))}
              </ul>
            )}
            {children && <div className="mb-8">{children}</div>}
            {ctaText && ctaLink && (
              <Button asChild size="lg" className="mt-4 group">
                <a href={ctaLink}>
                  {ctaText}
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
}; 