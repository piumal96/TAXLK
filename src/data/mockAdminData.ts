// Mock data for admin panel UI prototype

export interface TaxSlab {
  id: string;
  order: number;
  limit: number | null; // null = infinity/remaining
  rate: number;
  label: string;
}

export interface TaxVersion {
  id: string;
  version: string;
  name: string;
  taxFreeThreshold: number;
  slabs: TaxSlab[];
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  status: 'draft' | 'active' | 'archived';
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'analyst';
  status: 'active' | 'disabled';
  totalCalculations: number;
  lastActive: string;
  createdAt: string;
}

export interface CalculationRecord {
  id: string;
  userId: string;
  userName: string;
  totalIncome: number;
  taxableIncome: number;
  totalTax: number;
  effectiveRate: number;
  date: string;
  taxVersion: string;
}

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  module: string;
  timestamp: string;
  oldValue?: string;
  newValue?: string;
}

export const mockTaxVersions: TaxVersion[] = [
  {
    id: 'v3',
    version: '3.0',
    name: '2025/2026 Tax Year',
    taxFreeThreshold: 1_800_000,
    slabs: [
      { id: 's1', order: 1, limit: 1_000_000, rate: 0.06, label: 'First Rs. 1,000,000' },
      { id: 's2', order: 2, limit: 500_000, rate: 0.18, label: 'Next Rs. 500,000' },
      { id: 's3', order: 3, limit: 500_000, rate: 0.24, label: 'Next Rs. 500,000' },
      { id: 's4', order: 4, limit: 500_000, rate: 0.30, label: 'Next Rs. 500,000' },
      { id: 's5', order: 5, limit: null, rate: 0.36, label: 'Remaining' },
    ],
    isActive: true,
    createdAt: '2025-04-01',
    createdBy: 'Super Admin',
    status: 'active',
  },
  {
    id: 'v2',
    version: '2.0',
    name: '2024/2025 Tax Year',
    taxFreeThreshold: 1_200_000,
    slabs: [
      { id: 's1', order: 1, limit: 500_000, rate: 0.06, label: 'First Rs. 500,000' },
      { id: 's2', order: 2, limit: 500_000, rate: 0.12, label: 'Next Rs. 500,000' },
      { id: 's3', order: 3, limit: 500_000, rate: 0.18, label: 'Next Rs. 500,000' },
      { id: 's4', order: 4, limit: 500_000, rate: 0.24, label: 'Next Rs. 500,000' },
      { id: 's5', order: 5, limit: 500_000, rate: 0.30, label: 'Next Rs. 500,000' },
      { id: 's6', order: 6, limit: null, rate: 0.36, label: 'Remaining' },
    ],
    isActive: false,
    createdAt: '2024-04-01',
    createdBy: 'Super Admin',
    status: 'archived',
  },
];

export const mockUsers: AdminUser[] = [
  { id: 'u1', name: 'Kasun Perera', email: 'kasun@example.com', role: 'user', status: 'active', totalCalculations: 24, lastActive: '2026-03-25', createdAt: '2025-06-15' },
  { id: 'u2', name: 'Nimali Fernando', email: 'nimali@example.com', role: 'user', status: 'active', totalCalculations: 18, lastActive: '2026-03-24', createdAt: '2025-07-20' },
  { id: 'u3', name: 'Ruwan Silva', email: 'ruwan@example.com', role: 'admin', status: 'active', totalCalculations: 5, lastActive: '2026-03-26', createdAt: '2025-01-10' },
  { id: 'u4', name: 'Dilini Jayawardena', email: 'dilini@example.com', role: 'analyst', status: 'active', totalCalculations: 12, lastActive: '2026-03-20', createdAt: '2025-09-01' },
  { id: 'u5', name: 'Chaminda Bandara', email: 'chaminda@example.com', role: 'user', status: 'disabled', totalCalculations: 3, lastActive: '2025-12-10', createdAt: '2025-11-01' },
  { id: 'u6', name: 'Sachini Gunawardena', email: 'sachini@example.com', role: 'user', status: 'active', totalCalculations: 31, lastActive: '2026-03-26', createdAt: '2025-05-05' },
  { id: 'u7', name: 'Tharaka Weerasinghe', email: 'tharaka@example.com', role: 'user', status: 'active', totalCalculations: 9, lastActive: '2026-03-22', createdAt: '2025-08-14' },
  { id: 'u8', name: 'Malsha Rathnayake', email: 'malsha@example.com', role: 'user', status: 'active', totalCalculations: 15, lastActive: '2026-03-23', createdAt: '2025-04-18' },
];

export const mockCalculations: CalculationRecord[] = [
  { id: 'c1', userId: 'u1', userName: 'Kasun Perera', totalIncome: 4_200_000, taxableIncome: 2_400_000, totalTax: 312_000, effectiveRate: 7.43, date: '2026-03-25', taxVersion: '3.0' },
  { id: 'c2', userId: 'u2', userName: 'Nimali Fernando', totalIncome: 3_600_000, taxableIncome: 1_800_000, totalTax: 204_000, effectiveRate: 5.67, date: '2026-03-24', taxVersion: '3.0' },
  { id: 'c3', userId: 'u6', userName: 'Sachini Gunawardena', totalIncome: 7_500_000, taxableIncome: 5_700_000, totalTax: 1_188_000, effectiveRate: 15.84, date: '2026-03-26', taxVersion: '3.0' },
  { id: 'c4', userId: 'u7', userName: 'Tharaka Weerasinghe', totalIncome: 2_400_000, taxableIncome: 600_000, totalTax: 36_000, effectiveRate: 1.50, date: '2026-03-22', taxVersion: '3.0' },
  { id: 'c5', userId: 'u8', userName: 'Malsha Rathnayake', totalIncome: 5_100_000, taxableIncome: 3_300_000, totalTax: 564_000, effectiveRate: 11.06, date: '2026-03-23', taxVersion: '3.0' },
  { id: 'c6', userId: 'u1', userName: 'Kasun Perera', totalIncome: 4_000_000, taxableIncome: 2_200_000, totalTax: 276_000, effectiveRate: 6.90, date: '2026-02-15', taxVersion: '3.0' },
];

export const mockAuditLogs: AuditLog[] = [
  { id: 'a1', user: 'Super Admin', action: 'Activated tax version 3.0', module: 'Tax Config', timestamp: '2025-04-01 09:00:00' },
  { id: 'a2', user: 'Ruwan Silva', action: 'Disabled user Chaminda Bandara', module: 'Users', timestamp: '2025-12-11 14:30:00' },
  { id: 'a3', user: 'Super Admin', action: 'Updated tax-free threshold', module: 'Tax Config', timestamp: '2025-04-01 08:45:00', oldValue: 'Rs. 1,200,000', newValue: 'Rs. 1,800,000' },
  { id: 'a4', user: 'Super Admin', action: 'Changed APIT rounding rule', module: 'Settings', timestamp: '2026-01-15 10:20:00', oldValue: 'Floor', newValue: 'Round' },
  { id: 'a5', user: 'Ruwan Silva', action: 'Exported user data report', module: 'Reports', timestamp: '2026-03-20 16:00:00' },
];

export const mockAnalytics = {
  totalUsers: 847,
  totalCalculations: 3_241,
  averageIncome: 4_350_000,
  averageTax: 485_000,
  monthlyUsage: [
    { month: 'Oct', calculations: 180 },
    { month: 'Nov', calculations: 220 },
    { month: 'Dec', calculations: 310 },
    { month: 'Jan', calculations: 420 },
    { month: 'Feb', calculations: 380 },
    { month: 'Mar', calculations: 510 },
  ],
  incomeDistribution: [
    { name: 'Employment', value: 62, fill: 'hsl(230, 65%, 52%)' },
    { name: 'Business', value: 25, fill: 'hsl(152, 55%, 42%)' },
    { name: 'Investment', value: 13, fill: 'hsl(38, 92%, 50%)' },
  ],
  bracketUsage: [
    { bracket: '6%', count: 890 },
    { bracket: '18%', count: 620 },
    { bracket: '24%', count: 410 },
    { bracket: '30%', count: 280 },
    { bracket: '36%', count: 140 },
  ],
};
