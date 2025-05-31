import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface SoapNoteData {
  patientName?: string;
  dateOfBirth?: string;
  visitDate?: string;
  chiefComplaint: string;
  historyOfPresentIllness: string;
  pastMedicalHistory: string;
  medications: string;
  allergies: string;
  reviewOfSystems: string;
  physicalExam: string;
  assessment: string;
  plan: string;
  icdCodes?: Array<{code: string, description: string}>;
  version?: number;
  timestamp?: string;
}

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

export const SoapNoteProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [soapNoteData, setSoapNoteData] = useState<SoapNoteData>(defaultSoapNote);
  const [hasChanges, setHasChanges] = useState(false);

  const updateSoapNote = (newData: Partial<SoapNoteData>) => {
    setSoapNoteData(prev => {
      const updated = {
        ...prev,
        ...newData,
        version: (prev.version || 1) + 1,
        timestamp: new Date().toISOString()
      };
      setHasChanges(true);
      return updated;
    });
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