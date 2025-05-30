import { useRef, useState } from "react";
import "./App.scss";
import { LiveAPIProvider } from "./contexts/LiveAPIContext";
import { SoapNoteProvider } from "./contexts/SoapNoteContext";
import SidePanel from "./components/side-panel/SidePanel";
import { Altair } from "./components/altair/Altair";
import SoapNote from "./components/soap-notes/SoapNote";
import ControlTray from "./components/control-tray/ControlTray";
import cn from "classnames";
import { LiveClientOptions } from "./types";

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY as string;
if (typeof API_KEY !== "string") {
  throw new Error("set REACT_APP_GEMINI_API_KEY in .env");
}

const apiOptions: LiveClientOptions = {
  apiKey: API_KEY,
};

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [showSoapNote, setShowSoapNote] = useState(true);

  return (
    <div className="App">
      <LiveAPIProvider options={apiOptions}>
        <SoapNoteProvider>
          <div className="streaming-console">
            <SidePanel />
            <main>
              <div className="main-app-area">
                <Altair />
                <SoapNote isVisible={showSoapNote} />
                <video
                  className={cn("stream", {
                    hidden: !videoRef.current || !videoStream,
                  })}
                  ref={videoRef}
                  autoPlay
                  playsInline
                />
              </div>

              <ControlTray
                videoRef={videoRef}
                supportsVideo={true}
                onVideoStreamChange={setVideoStream}
                enableEditingSettings={true}
              />
            </main>
          </div>
        </SoapNoteProvider>
      </LiveAPIProvider>
    </div>
  );
}

export default App;