
import { User, Appointment, MedicalReport } from '../types';
import { MOCK_DOCTORS, MOCK_PATIENTS, MOCK_APPOINTMENTS, MOCK_REPORTS } from '../constants';

const KEYS = {
  USERS: 'medecho_users',
  APPOINTMENTS: 'medecho_appointments',
  REPORTS: 'medecho_reports',
  CURRENT_USER: 'medecho_session'
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const dbService = {
  init: () => {
    const storedUsers = localStorage.getItem(KEYS.USERS);
    if (!storedUsers) {
      localStorage.setItem(KEYS.USERS, JSON.stringify([...MOCK_DOCTORS, ...MOCK_PATIENTS]));
    } else {
      // Logic to force update physician avatars to ensure broken links are replaced automatically
      const users = JSON.parse(storedUsers);
      const updatedUsers = users.map((u: User) => {
        const mockMatch = MOCK_DOCTORS.find(m => m.id === u.id);
        if (mockMatch) {
          return { ...u, avatar: mockMatch.avatar };
        }
        return u;
      });
      localStorage.setItem(KEYS.USERS, JSON.stringify(updatedUsers));
      
      // Also update the current session if the logged-in user is a doctor
      const currentSession = localStorage.getItem(KEYS.CURRENT_USER);
      if (currentSession) {
        const user = JSON.parse(currentSession);
        const mockMatch = MOCK_DOCTORS.find(m => m.id === user.id);
        if (mockMatch) {
          localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify({ ...user, avatar: mockMatch.avatar }));
        }
      }
    }

    if (!localStorage.getItem(KEYS.APPOINTMENTS)) {
      localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(MOCK_APPOINTMENTS));
    }
    if (!localStorage.getItem(KEYS.REPORTS)) {
      localStorage.setItem(KEYS.REPORTS, JSON.stringify(MOCK_REPORTS));
    }
  },

  auth: {
    register: async (user: User): Promise<User> => {
      await delay(800);
      const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
      if (users.find((u: User) => u.email === user.email)) {
        throw new Error('User already exists');
      }
      users.push(user);
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
      return user;
    },
    login: async (email: string): Promise<User> => {
      await delay(600);
      const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
      const user = users.find((u: User) => u.email === email);
      if (!user) throw new Error('User not found. Check credentials.');
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
      return user;
    },
    updateUser: async (updatedUser: User): Promise<User> => {
      await delay(400);
      const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
      const index = users.findIndex((u: User) => u.id === updatedUser.id);
      if (index !== -1) {
        users[index] = updatedUser;
        localStorage.setItem(KEYS.USERS, JSON.stringify(users));
        localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(updatedUser));
      }
      return updatedUser;
    },
    logout: () => {
      localStorage.removeItem(KEYS.CURRENT_USER);
    },
    getCurrentUser: (): User | null => {
      const data = localStorage.getItem(KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    }
  },

  appointments: {
    getAll: async (): Promise<Appointment[]> => {
      await delay(300);
      return JSON.parse(localStorage.getItem(KEYS.APPOINTMENTS) || '[]');
    },
    create: async (apt: Appointment): Promise<Appointment> => {
      await delay(500);
      const appointments = JSON.parse(localStorage.getItem(KEYS.APPOINTMENTS) || '[]');
      appointments.unshift(apt);
      localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(appointments));
      return apt;
    },
    update: async (updatedApt: Appointment): Promise<Appointment> => {
      await delay(300);
      const appointments = JSON.parse(localStorage.getItem(KEYS.APPOINTMENTS) || '[]');
      const index = appointments.findIndex((a: Appointment) => a.id === updatedApt.id);
      if (index !== -1) {
        appointments[index] = updatedApt;
        localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(appointments));
      }
      return updatedApt;
    },
    delete: async (id: string): Promise<void> => {
      await delay(300);
      const appointments = JSON.parse(localStorage.getItem(KEYS.APPOINTMENTS) || '[]');
      const filtered = appointments.filter((a: Appointment) => a.id !== id);
      localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(filtered));
    }
  },

  reports: {
    getAll: async (): Promise<MedicalReport[]> => {
      await delay(300);
      return JSON.parse(localStorage.getItem(KEYS.REPORTS) || '[]');
    },
    create: async (report: MedicalReport): Promise<MedicalReport> => {
      await delay(500);
      const reports = JSON.parse(localStorage.getItem(KEYS.REPORTS) || '[]');
      reports.unshift(report);
      localStorage.setItem(KEYS.REPORTS, JSON.stringify(reports));
      return report;
    }
  }
};
