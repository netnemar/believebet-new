import React from 'react';

interface SolanaLogoProps {
  width?: number;
  height?: number;
  className?: string;
}

const SolanaLogo: React.FC<SolanaLogoProps> = ({ width = 16, height = 16, className = '' }) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 397.7 311.7" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <linearGradient id="solGradient" gradientTransform="rotate(90)">
        <stop offset="0%" stopColor="#9945FF" />
        <stop offset="100%" stopColor="#14F195" />
      </linearGradient>
      <path
        d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z"
        fill="url(#solGradient)"
      />
      <path
        d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z"
        fill="url(#solGradient)"
      />
      <path
        d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z"
        fill="url(#solGradient)"
      />
    </svg>
  );
};

export default SolanaLogo; 