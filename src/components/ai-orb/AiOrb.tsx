import React from 'react';
// Removed useState, useEffect
// import cn from 'classnames'; // Keep cn if you might use it later, otherwise remove
import styles from './AiOrb.module.scss';

interface AiOrbProps {
  isCameraOn: boolean;
  isSpeaking: boolean;
  soundIntensity?: number;
  style?: React.CSSProperties;
}

const AiOrb: React.FC<AiOrbProps> = ({ isCameraOn, isSpeaking, soundIntensity = 0, style }) => {
  // REMOVED: orbElements state and useEffect hook

  const combinedStyle = {
    ...style,
    '--sound-intensity': soundIntensity, // Pass sound intensity for CSS
  } as React.CSSProperties;

  return (
    <div
      className={styles.aiOrb} 
      style={combinedStyle}
    >
      {/* REMOVED: spikesContainer and orbElements rendering */}
    </div>
  );
};

export default AiOrb; 