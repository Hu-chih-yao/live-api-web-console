import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SoapNoteData } from '../components/soap-note/SoapNote';

interface SoapNoteContextType {
  soapNoteData: SoapNoteData;
  hasChanges: boolean;
  updateSoapNote: (data: Partial<SoapNoteData>) => void;
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
  version: 1,
  timestamp: new Date().toISOString()
};

const SoapNoteContext = createContext<SoapNoteContextType | undefined>(undefined);

export function SoapNoteProvider({ children }: { children: ReactNode }) {
  const [soapNoteData, setSoapNoteData] = useState<SoapNoteData>(defaultSoapNote);
  const [hasChanges, setHasChanges] = useState(false);

  const updateSoapNote = (newData: Partial<SoapNoteData>) => {
    setSoapNoteData(prevData => {
      const updatedData = {
        ...prevData,
        ...newData,
        version: (prevData.version || 1) + 1,
        timestamp: new Date().toISOString()
      };
      setHasChanges(true);
      return updatedData;
    });
  };

  return (
    <SoapNoteContext.Provider value={{ soapNoteData, hasChanges, updateSoapNote }}>
      {children}
    </SoapNoteContext.Provider>
  );
}

export function useSoapNote() {
  const context = useContext(SoapNoteContext);
  if (context === undefined) {
    throw new Error('useSoapNote must be used within a SoapNoteProvider');
  }
  return context;
}