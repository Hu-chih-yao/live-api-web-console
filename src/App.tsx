/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useRef, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.scss";
import { LiveAPIProvider, useLiveAPIContext } from "./contexts/LiveAPIContext";
import { SoapNoteProvider } from "./contexts/SoapNoteContext";
import SidePanel from "./components/side-panel/SidePanel";
import { Altair } from "./components/altair/Altair";
import ControlTray from "./components/control-tray/ControlTray";
import cn from "classnames";
import LandingPage from "./components/LandingPage";
import AiOrb from "./components/AiOrb/AiOrb";

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY as string;
if (typeof API_KEY !== "string") {
  throw new Error("set REACT_APP_GEMINI_API_KEY in .env");
}

const host = "generativelanguage.googleapis.com";
const uri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

function ConsultApp() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [userVolume, setUserVolume] = useState(0);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const { client } = useLiveAPIContext();

  useEffect(() => {
    let speakingTimer: NodeJS.Timeout | null = null;
    const handleAiActivity = () => {
      setIsAiSpeaking(true);
      if (speakingTimer) clearTimeout(speakingTimer);
      speakingTimer = setTimeout(() => setIsAiSpeaking(false), 2500);
    };

    const eventName = 'log' as const;

    if (client) {
      client.on(eventName, handleAiActivity);
    }

    return () => {
      if (speakingTimer) clearTimeout(speakingTimer);
      if (client) {
        client.off(eventName, handleAiActivity);
      }
    };
  }, [client]);

  const handleVolumeChange = (volume: number) => {
    setUserVolume(volume);
  };

  const userPulse = Math.min(1, Math.max(0, userVolume * 15));
  const aiPulse = isAiSpeaking ? 0.6 : 0;
  const pulseIntensity = Math.max(userPulse, aiPulse);
  
  // Calculate sound intensity for the sound-reactive border
  const soundIntensity = userVolume * 10; // Scale the volume for more pronounced effect

  const isCameraOn = !!videoStream;

  const orbStyle = {
    '--pulse-intensity': pulseIntensity,
  } as React.CSSProperties;

  return (
    <div className="App">
      <div className="streaming-console">
        <SidePanel />
        <main>
          <div className="main-app-area stage-area">
            {isCameraOn ? (
              <div className="participants-view"> 
                <div className="webcam-participant">
                  <video
                    className="stream"
                    ref={videoRef}
                    autoPlay
                    playsInline
                  />
                </div>
                <div className="ai-participant">
                  <AiOrb 
                    isCameraOn={isCameraOn} 
                    isSpeaking={isAiSpeaking} 
                    style={orbStyle} 
                    soundIntensity={soundIntensity}
                  />
                </div>
              </div>
            ) : (
              <AiOrb 
                isCameraOn={isCameraOn} 
                isSpeaking={isAiSpeaking} 
                style={orbStyle}
                soundIntensity={soundIntensity}
              />
            )}
            <Altair />
          </div>

          <ControlTray
            videoRef={videoRef}
            supportsVideo={true}
            onVideoStreamChange={setVideoStream}
            onVolumeChange={handleVolumeChange}
          >
            {/* put your own buttons here */}
          </ControlTray>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <LiveAPIProvider url={uri} apiKey={API_KEY}>
          <SoapNoteProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/consult" element={<ConsultApp />} />
              <Route path="/learn-more" element={<LandingPage />} />
            </Routes>
          </SoapNoteProvider>
        </LiveAPIProvider>
      </div>
    </Router>
  );
}

export default App;
