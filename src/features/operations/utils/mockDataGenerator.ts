import type { Operation, OperationStatus } from '../types/operation.types';

const STORAGE_KEY = 'app_operations_data_v1';

const STATUSES: OperationStatus[] = ['Pending', 'Running', 'Completed', 'Failed'];

const ASSIGNEES = [
  'Ahmed Hassan', 'Sara Mohamed', 'Omar Khaled', 'Nour El-Din',
  'Mona Zaki', 'Kareem Abdelaziz', 'Fatima Zahra', 'Youssef Ali',
  'Layla Mahmoud', 'Tarek Ziad'
];

const OPERATION_PREFIXES = [
  'Data Migration', 'Database Backup', 'System Upgrade', 'Payment Processing',
  'User Sync', 'Security Audit', 'Report Generation', 'Cache Invalidation',
  'API Integration', 'Log Archiving'
];

const OPERATION_SUFFIXES = [
  'Service', 'Task', 'Workflow', 'Pipeline', 'Job', 'Routine'
];

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export function generateInitialOperations(count: number = 5000): Operation[] {
  const existingData = localStorage.getItem(STORAGE_KEY);
  if (existingData) {
    try {
      return JSON.parse(existingData);
    } catch {
      console.warn('Failed to parse cached operations, regenerating...');
    }
  }

  const operations: Operation[] = [];
  const now = new Date();
  const pastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

  for (let i = 1; i <= count; i++) {
    const id = `OP-${10000 + i}`;
    const name = `${getRandomItem(OPERATION_PREFIXES)} ${getRandomItem(OPERATION_SUFFIXES)}`;
    const assignee = getRandomItem(ASSIGNEES);
    const status = getRandomItem(STATUSES);
    
    const createdDate = getRandomDate(pastYear, now);
    const updatedDate = getRandomDate(createdDate, now);

    operations.push({
      id,
      name,
      assignee,
      status,
      createdAt: createdDate.toISOString(),
      updatedAt: updatedDate.toISOString(),
    });
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(operations));
  return operations;
}

export function saveOperationsToStorage(operations: Operation[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(operations));
}