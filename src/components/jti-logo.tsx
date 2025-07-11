import { cn } from '@/lib/utils';

interface JtiLogoProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function JtiLogo({ className, size = 'medium' }: JtiLogoProps) {
  const sizeClasses = {
    small: { width: 150, height: 33 },
    medium: { width: 180, height: 39.6 },
    large: { width: 200, height: 44 },
  };

  const selectedSize = sizeClasses[size];

  return (
    <div className={cn('flex-shrink-0', className)} style={{ width: selectedSize.width, height: selectedSize.height }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 300 66"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="JTI Computer Education Logo"
      >
        <style>
          {`
            .jti-text { font-family: 'Space Grotesk', sans-serif; font-weight: bold; fill: hsl(var(--primary)); }
            .subtitle-text { font-family: 'Inter', sans-serif; fill: hsl(var(--muted-foreground)); }
            .primary-stroke { stroke: hsl(var(--primary)); }
          `}
        </style>
        
        {/* Icon part */}
        <g transform="translate(33, 33)">
          {/* Circle outline */}
          <circle cx="0" cy="0" r="30" className="primary-stroke" strokeWidth="2.5" fill="none" />
          
          {/* Laptop */}
          <g>
             {/* Laptop base with keyboard */}
            <path d="M -25 10 L 25 10 L 22 20 L -22 20 Z" fill="hsl(var(--muted-foreground))" />
            <rect x="-21" y="11" width="42" height="8" fill="hsl(var(--accent))" rx="1"/>

            {/* Laptop screen */}
            <rect x="-23" y="-15" width="46" height="25" fill="hsl(var(--muted-foreground))" rx="1" />
            <rect x="-21" y="-13" width="42" height="21" fill="hsl(var(--background))" />
            
            {/* Teacher icon */}
            <g transform="translate(0, -4)" fill="hsl(var(--primary))">
              <path d="M -5 5 Q -5 0 0 0 T 5 5 V 10 H -5 Z" />
              <circle cx="0" cy="-3" r="3" />
              <path d="M 5 6 L 10 1 L 18 -2" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" strokeLinecap="round" />
            </g>
          </g>
        </g>
        
        {/* Text part */}
        <g transform="translate(85, 0)">
          {/* JTI */}
          <text x="0" y="42" className="jti-text" fontSize="50">JTI</text>
          
          {/* Vertical line */}
          <line x1="88" y1="8" x2="88" y2="40" className="primary-stroke" strokeWidth="2.5" />
          
          {/* COMPUTER EDUCATION */}
          <text x="98" y="18" className="jti-text" letterSpacing="1" fontSize="15">COMPUTER</text>
          <line x1="98" y1="23" x2="238" y2="23" className="primary-stroke" strokeWidth="1.5" />
          <text x="98" y="38" className="jti-text" letterSpacing="1" fontSize="15">EDUCATION</text>
          
          {/* Subtitle */}
          <text x="98" y="52" className="subtitle-text" fontSize="8">Education & Training Division of</text>
          <text x="98" y="62" className="subtitle-text" fontSize="8">Jharkhand Technical Institute Pvt. Ltd.</text>
        </g>
      </svg>
    </div>
  );
}
