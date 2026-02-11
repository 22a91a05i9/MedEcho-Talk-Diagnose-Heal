
import { User, Appointment, MedicalReport } from './types';

export const MOCK_PATIENTS: User[] = [
  { id: 'p1', name: 'John Doe', email: 'john@example.com', role: 'PATIENT' },
  { id: 'p2', name: 'Jane Smith', email: 'jane@example.com', role: 'PATIENT' },
  { id: 'p3', name: 'Robert Brown', email: 'robert@example.com', role: 'PATIENT' },
];

export const MOCK_DOCTORS: User[] = [
  {
    id: 'd1',
    name: 'Dr. Sarah Wilson',
    email: 'sarah.w@medecho.ai',
    role: 'DOCTOR',
    specialization: 'Cardiologist',
    avatar: 'https://images.unsplash.com/photo-1638202993928-7267aad84c31?auto=format&fit=crop&q=80&w=800',
    contact: '+1 234 567 890',
    isAvailable: true,
    daySchedules: Array.from({length: 7}, (_, i) => ({
      dayIndex: i,
      slots: [{ startTime: '09:00', endTime: '13:00' }, { startTime: '15:00', endTime: '18:00' }],
      isActive: i >= 1 && i <= 5
    }))
  },
  {
    id: 'd2',
    name: 'Dr. James Miller',
    email: 'james.m@medecho.ai',
    role: 'DOCTOR',
    specialization: 'Neurologist',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=800',
    contact: '+1 234 567 891',
    isAvailable: true,
    daySchedules: Array.from({length: 7}, (_, i) => ({
      dayIndex: i,
      slots: [{ startTime: '10:00', endTime: '16:00' }],
      isActive: i >= 1 && i <= 5
    }))
  },
  {
    id: 'd3',
    name: 'Dr. Elena Rodriguez',
    email: 'elena.r@medecho.ai',
    role: 'DOCTOR',
    specialization: 'Pediatrician',
    avatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=800',
    contact: '+1 234 567 892',
    isAvailable: true,
    daySchedules: Array.from({length: 7}, (_, i) => ({
      dayIndex: i,
      slots: [{ startTime: '08:00', endTime: '14:00' }],
      isActive: i >= 1 && i <= 6
    }))
  },
  {
    id: 'd4',
    name: 'Dr. Marcus Chen',
    email: 'marcus.c@medecho.ai',
    role: 'DOCTOR',
    specialization: 'Orthopedic Surgeon',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031f?auto=format&fit=crop&q=80&w=800',
    contact: '+1 234 567 893',
    isAvailable: true,
    daySchedules: Array.from({length: 7}, (_, i) => ({
      dayIndex: i,
      slots: [{ startTime: '11:00', endTime: '19:00' }],
      isActive: [1, 3, 5].includes(i)
    }))
  },
  {
    id: 'd5',
    name: 'Dr. Amara Okafor',
    email: 'amara.o@medecho.ai',
    role: 'DOCTOR',
    specialization: 'Psychiatrist',
    avatar: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=800',
    contact: '+1 234 567 894',
    isAvailable: true,
    daySchedules: Array.from({length: 7}, (_, i) => ({
      dayIndex: i,
      slots: [{ startTime: '09:00', endTime: '17:00' }],
      isActive: i >= 1 && i <= 5
    }))
  }
];

export const MOCK_REPORTS: MedicalReport[] = [
  {
    id: 'r1',
    patientId: 'p1',
    doctorId: 'd1',
    date: '2023-10-15',
    doctorName: 'Dr. Sarah Wilson',
    diagnosis: 'Mild Hypertension',
    summary: 'Patient reported minor dizziness. Blood pressure was slightly elevated.',
    prescription: ['Lisinopril 10mg', 'Low sodium diet'],
    vitals: { bp: '140/90', weight: '72kg', temperature: '98.6F' }
  }
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'a1',
    patientId: 'p1',
    patientName: 'John Doe',
    doctorId: 'd1',
    doctorName: 'Dr. Sarah Wilson',
    date: '2026-03-20',
    time: '10:00',
    status: 'PENDING',
    type: 'IN-PERSON'
  }
];
