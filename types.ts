
export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export interface TimeSlot {
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

export interface BlockedSlot {
  id: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  reason: string;
  isAllDay: boolean;
}

export interface DaySchedule {
  dayIndex: number; // 0 = Sunday, 1 = Monday, etc.
  slots: TimeSlot[];
  isActive: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  specialization?: string;
  contact?: string;
  preferredLanguage?: string;
  isAvailable?: boolean; // Live status toggle
  workingHours?: string; // Legacy field
  daySchedules?: DaySchedule[];
  blockedSlots?: BlockedSlot[];
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  type: 'VIRTUAL' | 'IN-PERSON';
}

export interface MedicalReport {
  id: string;
  patientId: string;
  doctorId: string; // Linked to doctor
  date: string;
  doctorName: string;
  summary: string;
  diagnosis: string;
  prescription: string[];
  aiConfidence?: number;
  inputLanguage?: string;
  vitals?: {
    bp?: string;
    weight?: string;
    temperature?: string;
  };
}

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'REMINDER' | 'SUCCESS' | 'ALERT';
  timestamp: Date;
  isRead: boolean;
  appointmentId?: string;
}
