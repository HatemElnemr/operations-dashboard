import type {
  Operation,
  OperationStatus,
  OperationsFetchParams,
  OperationsResponse,
} from '../types/operation.types';
import { generateInitialOperations, saveOperationsToStorage } from '../utils/mockDataGenerator';

// دالة مساعدة لمحاكاة التأخير الزمني (Delay)
const delay = (ms: number, signal?: AbortSignal) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });

/**
 * Mock API Fetch Function
 * تدعم: البحث، الفلترة، الترتيب، إلغاء الطلبات (AbortSignal)، ومحاكاة الفشل العشوائي
 */
export async function fetchOperations(
  params: OperationsFetchParams,
  signal?: AbortSignal,
  shouldSimulateErrors: boolean = false
): Promise<OperationsResponse> {
  // 1. محاكاة تأخير شبكة عشوائي بين 300ms و 1200ms
  const randomDelay = Math.floor(Math.random() * 900) + 300;
  await delay(randomDelay, signal);

  // 2. محاكاة فشل السيرفر العشوائي (لو مفعلة أو عشوائياً بنسبة 10%)
  if (shouldSimulateErrors && Math.random() < 0.15) {
    throw new Error('Failed to fetch operations. Server connection timed out.');
  }

  // 3. قراءة البيانات الأصلية
  let data = generateInitialOperations();

  // حساب الإحصائيات الشاملة قبل الفلترة (العدد الكلي لكل حالة)
  const stats: Record<OperationStatus, number> = {
    Pending: 0,
    Running: 0,
    Completed: 0,
    Failed: 0,
  };

  data.forEach((item) => {
    if (stats[item.status] !== undefined) {
      stats[item.status]++;
    }
  });

  // 4. تطبيق البحث (حسب الـ ID أو Name)
  if (params.search && params.search.trim() !== '') {
    const query = params.search.trim().toLowerCase();
    data = data.filter(
      (item) =>
        item.id.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query) ||
        item.assignee.toLowerCase().includes(query)
    );
  }

  // 5. تطبيق الفلترة بالـ Status
  if (params.status && params.status !== 'All') {
    data = data.filter((item) => item.status === params.status);
  }

  // 6. تطبيق الترتيب (Sorting)
  const sortBy = params.sortBy || 'createdAt';
  const sortOrder = params.sortOrder || 'desc';

  data.sort((a, b) => {
    const dateA = new Date(a[sortBy]).getTime();
    const dateB = new Date(b[sortBy]).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  // 7. تطبيق الـ Pagination ( slicing بعد الفلترة والترتيب )
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, params.limit || 50);
  const pagedData = data.slice((page - 1) * limit, page * limit);

  return {
    data: pagedData,
    total: data.length,
    stats,
  };
}

/**
 * Mock API Mutation: لتحديث حالة عملية معينة
 */
export async function updateOperationStatus(
  id: string,
  newStatus: OperationStatus
): Promise<Operation> {
  await delay(400); // محاكاة تأخير بسيط للشبكة

  const operations = generateInitialOperations();
  const index = operations.findIndex((op) => op.id === id);

  if (index === -1) {
    throw new Error('Operation not found');
  }

  const updatedOperation: Operation = {
    ...operations[index],
    status: newStatus,
    updatedAt: new Date().toISOString(),
  };

  operations[index] = updatedOperation;
  saveOperationsToStorage(operations);

  return updatedOperation;
}