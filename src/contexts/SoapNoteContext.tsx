import React, { createContext, useContext, useState } from 'react';
import { SoapNoteData } from '../components/soap-notes/SoapNote';

interface SoapNoteContextType {
  soapNoteData: SoapNoteData;
  hasChanges: boolean;
  updateSoapNote: (data: Partial<SoapNoteData>) => void;
  resetSoapNote: () => void;
}

const defaultSoapNote: SoapNoteData = {
  chiefComplaint: '',
  historyOfPresentIllness: '',
  pastMedicalHistory: '',
  medications: '',
  allergies: '',
  reviewOfSystems: '',
  physicalExam: '',
  assessment: '',
  plan: '',
  icdCodes: [],
  version: 1,
  timestamp: new Date().toISOString()
};

const SoapNoteContext = createContext<SoapNoteContextType | undefined>(undefined);

export function SoapNoteProvider({ children }: { children: React.ReactNode }) {
  const [soapNoteData, setSoapNoteData] = useState<SoapNoteData>(defaultSoapNote);
  const [hasChanges, setHasChanges] = useState(false);

  const updateSoapNote = (newData: Partial<SoapNoteData>) => {
    setSoapNoteData(prevData => {
      const updatedData = {
        ...prevData,
        ...newData,
        version: prevData.version ? prevData.version + 1 : 1,
        timestamp: new Date().toISOString()
      };
      setHasChanges(true);
      return updatedData;
    });
  };

  const resetSoapNote = () => {
    setSoapNoteData(defaultSoapNote);
    setHasChanges(false);
  };

  return (
    <SoapNoteContext.Provider value={{ soapNoteData, hasChanges, updateSoapNote, resetSoapNote }}>
      {children}
    </SoapNoteContext.Provider>
  );
}

export function useSoapNote() {
  const context = useContext(SoapNoteContext);
  if (!context) {
    throw new Error('useSoapNote must be used within a SoapNoteProvider');
  }
  return context;
}