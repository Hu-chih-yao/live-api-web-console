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
  subjective?: string;
  objective?: string;
}