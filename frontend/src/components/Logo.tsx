interface LogoProps {
     variant?: 'full' | 'icon';
     className?: string;
     size?: number;
}

/**
 * VoxDuck Logo Component
 * - Full variant: Voice wave icon + "VoxDuck" wordmark
 * - Icon variant: Voice wave icon only (for favicon/small sizes)
 * 
 * The voice wave icon replaces the "o" in "Vox" and features
 * a cyan-to-violet gradient on the sound bars.
 */
function Logo({ variant = 'full', className = '', size = 40 }: LogoProps) {
     // Voice wave icon with gradient
     const VoiceWaveIcon = ({ iconSize = size }: { iconSize?: number }) => (
          <svg
               width={iconSize}
               height={iconSize}
               viewBox="0 0 40 40"
               fill="none"
               xmlns="http://www.w3.org/2000/svg"
               aria-hidden="true"
          >
               <defs>
                    <linearGradient id="voiceWaveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                         <stop offset="0%" stopColor="var(--color-accent-cyan, #22D3EE)" />
                         <stop offset="100%" stopColor="var(--color-accent-violet, #7C3AED)" />
                    </linearGradient>
               </defs>
               {/* Circle background */}
               <circle cx="20" cy="20" r="18" fill="var(--color-bg-surface, #111827)" />
               {/* Sound wave bars with gradient */}
               <rect x="10" y="14" width="3" height="12" rx="1.5" fill="url(#voiceWaveGradient)" />
               <rect x="15" y="10" width="3" height="20" rx="1.5" fill="url(#voiceWaveGradient)" />
               <rect x="20" y="6" width="3" height="28" rx="1.5" fill="url(#voiceWaveGradient)" />
               <rect x="25" y="10" width="3" height="20" rx="1.5" fill="url(#voiceWaveGradient)" />
               <rect x="30" y="14" width="3" height="12" rx="1.5" fill="url(#voiceWaveGradient)" />
          </svg>
     );

     if (variant === 'icon') {
          return (
               <div className={`logo logo-icon ${className}`} aria-label="VoxDuck">
                    <VoiceWaveIcon iconSize={size} />
               </div>
          );
     }

     return (
          <div className={`logo logo-full ${className}`} aria-label="VoxDuck">
               <span className="logo-text logo-text-vox">V</span>
               <VoiceWaveIcon iconSize={size * 0.9} />
               <span className="logo-text logo-text-vox">x</span>
               <span className="logo-text logo-text-duck">Duck</span>
          </div>
     );
}

export default Logo;
