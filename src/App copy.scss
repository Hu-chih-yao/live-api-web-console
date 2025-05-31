:root {
  --text: #1D1D1F;
  --gray-200: #b4b8bb;
  --gray-300: #86868B;
  --gray-500: #5f6368;
  --gray-600: #444444;
  --gray-700: #202020;
  --gray-800: #171717;
  --gray-900: #111111;
  --gray-1000: #0a0a0a;
  --border-stroke: #DCDEE4;
  --accent-blue: rgb(161, 228, 242);
  --accent-blue-active-bg: #001233;
  --accent-blue-active: #98beff;
  --accent-blue-headers: #448dff;
  --accent-green: rgb(168, 218, 181);

  --midnight-blue: rgb(0, 18, 51);
  --blue-30: #99beff;

  --accent-red: #ff4600;

  --background: #FFFFFF;
  --color: var(--text);

  scrollbar-color: var(--gray-600) var(--background);
  scrollbar-width: thin;

  --font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;

  /* */
  --Neutral-00: #000;
  --Neutral-5: #FFFFFF;
  --Neutral-10: #F5F5F7;
  --Neutral-15: #EFEFEF;
  --Neutral-20: #E8E8E8;
  --Neutral-30: #DCDEE4;
  --Neutral-50: #707577;
  --Neutral-60: #888d8f;
  --Neutral-80: #c3c6c7;
  --Neutral-90: #e1e2e3;

  --Green-500: #0d9c53;
  --Green-700: #025022;

  --Blue-500: #3E7BFA;
  --Blue-800: #0f3557;

  --Red-400: #ff9c7a;
  --Red-500: #ff4600;
  --Red-600: #e03c00;
  --Red-700: #bd3000;
  
  --primary-purple: #8A2BE2;
}

body {
  font-family: var(--font-family);
  background: var(--background);
  color: var(--text);
}

.material-symbols-outlined {
  &.filled {
    font-variation-settings:
      "FILL" 1,
      "wght" 400,
      "GRAD" 0,
      "opsz" 24;
  }
}

.space-mono-regular {
  font-family: "Space Mono", monospace;
  font-weight: 400;
  font-style: normal;
}

.space-mono-bold {
  font-family: "Space Mono", monospace;
  font-weight: 700;
  font-style: normal;
}

.space-mono-regular-italic {
  font-family: "Space Mono", monospace;
  font-weight: 400;
  font-style: italic;
}

.space-mono-bold-italic {
  font-family: "Space Mono", monospace;
  font-weight: 700;
  font-style: italic;
}

.hidden {
  display: none;
}

.flex {
  display: flex;
}

.h-screen-full {
  height: 100vh;
}

.w-screen-full {
  width: 100vw;
}

.flex-col {
  flex-direction: column;
}

@media (prefers-reduced-motion: no-preference) {}

.streaming-console {
  display: flex;
  height: 100vh;
  background-color: #f0f2f5;

  main {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }
}

.stage-area {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background-color: #ffffff;
  margin: 1rem;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.video-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  box-sizing: border-box;

  .stream {
    max-width: 100%;
    max-height: 100%;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    border-radius: 12px;
    z-index: 1;
  }
}

.control-tray {
  width: 100%;
  padding: 1rem 0;
  display: flex;
  justify-content: center;
  flex-shrink: 0;
  z-index: 100;
}

.main-app-area > .altair-container,
.main-app-area > .welcome-overlay {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 20;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 10px;
  border-radius: 8px;
  max-width: 300px;
}

/* video player */
.stream {
  flex-grow: 1;
  max-width: 90%;
  border-radius: 16px;
  max-height: fit-content;
  border: 1px solid var(--border-stroke);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
}

// New styles for the participants layout
.participants-view {
  display: flex;
  width: 100%;
  height: 100%;
  padding: 1rem; // Padding around the participant blocks
  gap: 1rem; // Space between the blocks
  box-sizing: border-box;
}

.webcam-participant, .ai-participant {
  flex: 1; // Each takes up half the space
  height: 100%; // Fill the height of the participants-view
  border: 1px solid #e0e0e0; // Subtle border like Google Meet
  border-radius: 12px; // Rounded corners
  overflow: hidden; // Clip content
  position: relative; // Needed for positioning content like the orb
  display: flex; 
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa; // Light background
}

.webcam-participant {
  // Specific styles for webcam container if needed
  .stream { // Target the video stream within this container
    width: 100%; // Make video fill its container
    height: 100%; // Make video fill its container
    object-fit: cover; // Cover the area, cropping if necessary
    display: block; // Remove extra space below video
    border-radius: 0; // Remove radius if container has it
    /* Remove conflicting styles from global .stream if any */
    max-width: none; 
    max-height: none;
    border: none;
    box-shadow: none;
  }
}

.ai-participant {
  // Specific styles for AI container
  .AiOrb_aiOrb__tjQHQ { // Target the AiOrb component using its generated classname (adjust if needed)
    position: absolute; // Use absolute to allow translate centering
    top: 50%;           // Center vertically
    left: 50%;          // Center horizontally
    // REMOVE transform: none; 
    // The transform is now set in AiOrb.module.scss and includes translate AND scale
    
    // Adjust orb size if needed for the container
    --orb-size: 300px; // Example: smaller orb size (adjust as needed)
    width: var(--orb-size);
    height: var(--orb-size);
  }
}
