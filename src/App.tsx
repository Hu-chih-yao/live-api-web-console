import { useRef, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import classNames from "classnames";
import "./App.scss";
import { LiveAPIProvider } from "./contexts/LiveAPIContext";
import { SoapNoteProvider } from "./contexts/SoapNoteContext";
import SidePanel from "./components/side-panel/SidePanel";
import { Altair } from "./components/altair/Altair";
import ControlTray from "./components/control-tray/ControlTray";
import LandingPage from "./components/landing-page/LandingPage";
import { LiveClientOptions } from "./types";

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY as string;
if (typeof API_KEY !== "string") {
  throw new Error("set REACT_APP_GEMINI_API_KEY in .env");
}

const apiOptions: LiveClientOptions = {
  apiKey: API_KEY,
};

function ConsultationView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  return (
    <div className="streaming-console">
      <SidePanel />
      <main>
        <div className="main-app-area">
          <div className="participants-view">
            <div className="webcam-participant">
              <video
                className={classNames("stream", {
                  hidden: !videoRef.current || !videoStream,
                })}
                ref={videoRef}
                autoPlay
                playsInline
              />
            </div>
            <div className="ai-participant">
              <Altair />
            </div>
          </div>
        </div>

        <ControlTray
          videoRef={videoRef}
          supportsVideo={true}
          onVideoStreamChange={setVideoStream}
          enableEditingSettings={true}
        />
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <LiveAPIProvider options={apiOptions}>
        <SoapNoteProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/consult" element={<ConsultationView />} />
          </Routes>
        </SoapNoteProvider>
      </LiveAPIProvider>
    </Router>
  );
}

export default App;