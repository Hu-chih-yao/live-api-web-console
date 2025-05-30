import React, { createContext, useContext, useState } from 'react';
import { SoapNoteData } from '../components/soap-notes/SoapNote';

interface SoapNoteContextType {
  soapNoteData: SoapNoteData;
  hasChanges: boolean;
  updateSoapNote: (data: Partial<SoapNoteData>) => void;
}

const SoapNoteContext = createContext<SoapNoteContextType | undefined>(undefined);

export const SoapNoteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [soapNoteData, setSoapNoteData] = useState<SoapNoteData>({
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
  });
  const [hasChanges, setHasChanges] = useState(false);

  const updateSoapNote = (data: Partial<SoapNoteData>) => {
    setSoapNoteData(prev => ({
      ...prev,
      ...data,
      version: (prev.version || 1) + 1,
      timestamp: new Date().toISOString()
    }));
    setHasChanges(true);
  };

  return (
    <SoapNoteContext.Provider value={{ soapNoteData, hasChanges, updateSoapNote }}>
      {children}
    </SoapNoteContext.Provider>
  );
};

export const useSoapNote = () => {
  const context = useContext(SoapNoteContext);
  if (!context) {
    throw new Error('useSoapNote must be used within a SoapNoteProvider');
  }
  return context;
};