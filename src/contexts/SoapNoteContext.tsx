import React, { createContext, useContext, useState } from 'react';
import { SoapNoteData } from '../components/soap-notes/SoapNote';

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
};

const SoapNoteContext = createContext<SoapNoteContextType | undefined>(undefined);

export function SoapNoteProvider({ children }: { children: React.ReactNode }) {
  const [soapNoteData, setSoapNoteData] = useState<SoapNoteData>(defaultSoapNote);
  const [hasChanges, setHasChanges] = useState(false);

  const updateSoapNote = (newData: Partial<SoapNoteData>) => {
    setSoapNoteData(prevData => {
      const updatedData = { ...prevData, ...newData };
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
  if (!context) {
    throw new Error('useSoapNote must be used within a SoapNoteProvider');
  }
  return context;
}