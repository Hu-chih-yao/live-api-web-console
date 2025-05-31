import React, { createContext, useContext, useState, useCallback } from 'react';
import { SoapNoteData } from '../types/soap-note';

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
  plan: ''
};

const SoapNoteContext = createContext<SoapNoteContextType | undefined>(undefined);

export const SoapNoteProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [soapNoteData, setSoapNoteData] = useState<SoapNoteData>(defaultSoapNote);
  const [hasChanges, setHasChanges] = useState(false);

  const updateSoapNote = useCallback((newData: Partial<SoapNoteData>) => {
    setSoapNoteData(prev => ({
      ...prev,
      ...newData
    }));
    setHasChanges(true);
  }, []);

  return (
    <SoapNoteContext.Provider value={{ soapNoteData, hasChanges, updateSoapNote }}>
      {children}
    </SoapNoteContext.Provider>
  );
};

export const useSoapNote = () => {
  const context = useContext(SoapNoteContext);
  if (context === undefined) {
    throw new Error('useSoapNote must be used within a SoapNoteProvider');
  }
  return context;
};