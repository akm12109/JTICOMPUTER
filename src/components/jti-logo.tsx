import { cn } from '@/lib/utils';

interface JtiLogoProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
  textColor?: string;
}

export default function JtiLogo({ className, size = 'medium', textColor = "text-primary-foreground" }: JtiLogoProps) {
  const sizeClasses = {
    small: 'w-20 h-12 text-xl',
    medium: 'w-24 h-14 text-2xl',
    large: 'w-28 h-16 text-3xl',
  };
  
  const ballSizeClasses = {
      small: 'w-5 h-5',
      medium: 'w-6 h-6',
      large: 'w-7 h-7'
  }

  const goddaTextSizeClasses = {
    small: 'text-[0.6rem] mt-1',
    medium: 'text-[0.7rem] mt-1',
    large: 'text-[0.8rem] mt-1.5',
  }

  return (
    <div className={cn('relative font-headline font-bold select-none flex-shrink-0', sizeClasses[size], className)}>
      <svg className="absolute w-0 h-0">
        <defs>
          <filter id="gooey-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>
      <div className="logo-container w-full h-full">
         <div className={cn("goo-ball top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2", ballSizeClasses[size])}></div>
         <div className={cn("goo-ball top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2", ballSizeClasses[size])}></div>
         <div className={cn("goo-ball top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2", ballSizeClasses[size])}></div>
      </div>
      <div className={cn("absolute inset-0 flex flex-col items-center justify-center z-10 leading-none", textColor)}>
        <span>JTI</span>
        <span className={cn('font-normal tracking-widest uppercase', goddaTextSizeClasses[size])}>
            Godda
        </span>
      </div>
    </div>
  );
}
