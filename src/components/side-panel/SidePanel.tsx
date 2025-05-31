import cn from "classnames";
import { useEffect, useRef, useState } from "react";
import { RiSidebarFoldLine, RiSidebarUnfoldLine } from "react-icons/ri";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { useLoggerStore } from "../../lib/store-logger";
import { useSoapNote } from "../../contexts/SoapNoteContext";
import Logger from "../logger/Logger";
import ProductionLogger from "../logger/production-logger/ProductionLogger";
import SoapNote from "../soap-notes/SoapNote";
import "./side-panel.scss";

// Enum for the different panel tabs
enum PanelTab {
  CHAT = 'chat',
  SOAP_NOTE = 'medical_note'
}

export default function SidePanel() {
  const { connected, client } = useLiveAPIContext();
  const [open, setOpen] = useState(false);
  const loggerRef = useRef<HTMLDivElement>(null);
  const loggerLastHeightRef = useRef<number>(-1);
  const { log, logs } = useLoggerStore();
  const { updateSoapNote, hasChanges } = useSoapNote();
  const [devMode, setDevMode] = useState(false);
  const [activeTab, setActiveTab] = useState<PanelTab>(PanelTab.CHAT);
  const [notePulse, setNotePulse] = useState(false);
  const [textInput, setTextInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (loggerRef.current) {
      const el = loggerRef.current;
      const scrollHeight = el.scrollHeight;
      if (scrollHeight !== loggerLastHeightRef.current) {
        el.scrollTop = scrollHeight;
        loggerLastHeightRef.current = scrollHeight;
      }
    }
  }, [logs]);

  useEffect(() => {
    client.on("log", log);
    
    const checkForSoapNoteUpdates = (logData: any) => {
      if (logData?.serverContent?.modelTurn?.parts) {
        const { parts } = logData.serverContent.modelTurn;
        
        parts.forEach((part: any) => {
          if (part.functionCall?.name === "update_soap_note") {
            const args = part.functionCall.args;
            if (args) {
              updateSoapNote(args);
              if (activeTab !== PanelTab.SOAP_NOTE) {
                setNotePulse(true);
                setTimeout(() => setNotePulse(false), 2000);
              }
            }
          }
        });
      }

      // Extract from user messages
      if (logData?.userMessage?.text) {
        const userText = logData.userMessage.text.trim();
        if (userText && !userText.includes('print(') && !userText.includes('code')) {
          updateSoapNote({
            historyOfPresentIllness: userText,
            chiefComplaint: !hasChanges ? userText : undefined
          });
        }
      }
    };
    
    client.on("log", checkForSoapNoteUpdates);
    
    return () => {
      client.off("log", log);
      client.off("log", checkForSoapNoteUpdates);
    };
  }, [client, log, updateSoapNote, activeTab, hasChanges]);

  const handleSubmit = () => {
    if (!textInput.trim()) return;
    
    client.send([{ text: textInput }]);
    setTextInput("");
  };

  const handleTabChange = (tab: PanelTab) => {
    setActiveTab(tab);
    if (tab === PanelTab.SOAP_NOTE) {
      setNotePulse(false);
    }
  };

  return (
    <div className={`side-panel ${open ? "open" : ""}`}>
      <header className="top">
        <h2>
          {open && (activeTab === PanelTab.CHAT ? 'Chat History' : 'Medical Note')}
        </h2>
        {open ? (
          <button className="opener" onClick={() => setOpen(false)}>
            <RiSidebarFoldLine color="var(--primary-purple)" />
          </button>
        ) : (
          <button className="opener" onClick={() => setOpen(true)}>
            <RiSidebarUnfoldLine color="var(--primary-purple)" />
          </button>
        )}
      </header>
      
      {open && (
        <>
          <section className="tab-selector">
            <button 
              className={`tab-button ${activeTab === PanelTab.CHAT ? 'active' : ''}`}
              onClick={() => handleTabChange(PanelTab.CHAT)}
            >
              Chat
            </button>
            <button 
              className={`tab-button ${activeTab === PanelTab.SOAP_NOTE ? 'active' : ''} ${notePulse ? 'pulse' : ''}`}
              onClick={() => handleTabChange(PanelTab.SOAP_NOTE)}
            >
              Medical Note
              {hasChanges && activeTab !== PanelTab.SOAP_NOTE && (
                <span className="notification-dot"></span>
              )}
            </button>
          </section>
          
          <section className="indicators">
            <div className="dev-mode-toggle">
              <button 
                className={`dev-toggle-btn ${devMode ? 'active' : ''}`} 
                onClick={() => setDevMode(!devMode)}
              >
                {devMode ? "Developer Mode" : "Simple Mode"}
              </button>
            </div>
            <div className={cn("streaming-indicator", { connected })}>
              {connected
                ? `🟢${open ? " Connected" : ""}`
                : `⚪${open ? " Disconnected" : ""}`}
            </div>
          </section>
        </>
      )}
      
      <div className="side-panel-container" ref={loggerRef}>
        {open && activeTab === PanelTab.CHAT ? (
          devMode ? <Logger filter="none" /> : <ProductionLogger />
        ) : open && activeTab === PanelTab.SOAP_NOTE ? (
          <SoapNote isVisible={true} />
        ) : null}
      </div>
      
      {open && activeTab === PanelTab.CHAT && (
        <div className={cn("input-container", { disabled: !connected })}>
          <div className="input-content">
            <textarea
              className="input-area"
              ref={inputRef}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSubmit();
                }
              }}
              onChange={(e) => setTextInput(e.target.value)}
              value={textInput}
              placeholder="Type something here..."
            />
            <button
              className="send-button material-symbols-outlined filled"
              onClick={handleSubmit}
            >
              send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}