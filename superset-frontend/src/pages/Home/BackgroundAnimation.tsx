import React from 'react';

type ParticleBackgroundProps = {
  className?: string;
};

const ParticleBackground: React.FC<ParticleBackgroundProps> = ({
  className,
}) => {
  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        backgroundImage: `
          radial-gradient(rgba(255, 255, 255, 0.15) 2px, transparent 2px),
          radial-gradient(rgba(255, 213, 150, 0.1) 2px, transparent 2px)
        `,
        backgroundSize: '30px 30px, 25px 25px',
        backgroundPosition: '0 0, 15px 15px',
        opacity: 0.8,
        maskImage:
          'linear-gradient(to bottom, transparent, black 10%, black 80%, transparent)',
        WebkitMaskImage:
          'linear-gradient(to bottom, transparent, black 10%, black 80%, transparent)',
      }}
    />
  );
};

export default ParticleBackground;
