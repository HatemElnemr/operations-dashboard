import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchOperations, updateOperationStatus } from '../features/operations/api/operationsApi';
import { generateInitialOperations, saveOperationsToStorage } from '../features/operations/utils/mockDataGenerator';
import { makeOperation } from './testUtils';

// نعزل طبقة الـ API عن المولد العشوائي: بيانات ثابتة تحت سيطرتنا
vi.mock('../features/operations/utils/mockDataGenerator', () => ({
  generateInitialOperations: vi.fn(),
  saveOperationsToStorage: vi.fn(),
}));

const generateMock = vi.mocked(generateInitialOperations);
const saveMock = vi.mocked(saveOperationsToStorage);

const dataset = [
  makeOperation('OP-1', {
    name: 'Payment Processing', assignee: 'Ahmed Hassan', status: 'Running',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-02T00:00:00.000Z',
  }),
  makeOperation('OP-2', {
    name: 'Payroll Export', assignee: 'Sara Mohamed', status: 'Pending',
    createdAt: '2025-02-01T00:00:00.000Z', updatedAt: '2025-02-02T00:00:00.000Z',
  }),
  makeOperation('OP-3', {
    name: 'Inventory Sync', assignee: 'Ahmed Hassan', status: 'Running',
    createdAt: '2025-03-01T00:00:00.000Z', updatedAt: '2025-03-02T00:00:00.000Z',
  }),
  makeOperation('OP-4', {
    name: 'Data Migration', assignee: 'Omar Khaled', status: 'Completed',
    createdAt: '2025-04-01T00:00:00.000Z', updatedAt: '2025-04-02T00:00:00.000Z',
  }),
  makeOperation('OP-5', {
    name: 'Report Generation', assignee: 'Sara Mohamed', status: 'Failed',
    createdAt: '2025-05-01T00:00:00.000Z', updatedAt: '2025-05-02T00:00:00.000Z',
  }),
];

/** يعيد نسخة طازجة كل استدعاء (الـ sort بيعدّل المصفوفة in-place). */
function seedData() {
  generateMock.mockImplementation(() => dataset.map((op) => ({ ...op })));
}

/** ينفذ تأخير الشبكة الواقعي ثم يعيد نتيجة الـ promise. */
async function flush<T>(promise: Promise<T>): Promise<T> {
  await vi.advanceTimersByTimeAsync(1300);
  return promise;
}

describe('fetchOperations', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    seedData();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns the full dataset with default pagination', async () => {
    const result = await flush(fetchOperations({}));

    expect(result.data).toHaveLength(5);
    expect(result.total).toBe(5);
  });

  it('computes stats over the whole dataset regardless of filters', async () => {
    const result = await flush(fetchOperations({ status: 'Running' }));

    expect(result.stats).toEqual({ Pending: 1, Running: 2, Completed: 1, Failed: 1 });
    // الفلترة أثرت على الصفوف لكن الإحصائيات عامة
    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('filters by ID substring, case-insensitively', async () => {
    const result = await flush(fetchOperations({ search: 'op-3' }));

    expect(result.data.map((op) => op.id)).toEqual(['OP-3']);
  });

  it('filters by operation name', async () => {
    const result = await flush(fetchOperations({ search: 'payroll' }));

    expect(result.data.map((op) => op.id)).toEqual(['OP-2']);
  });

  it('filters by assignee name', async () => {
    const result = await flush(fetchOperations({ search: 'omar' }));

    expect(result.data.map((op) => op.id)).toEqual(['OP-4']);
  });

  it('applies search AND status filter together (intersection)', async () => {
    // 'pay' يطابق OP-1 (Running) و OP-2 (Pending)، والفلترة Running تضيّق لـ OP-1 فقط
    const result = await flush(fetchOperations({ search: 'pay', status: 'Running' }));

    expect(result.data.map((op) => op.id)).toEqual(['OP-1']);
    expect(result.total).toBe(1);
  });

  it('sorts by createdAt descending by default (newest first)', async () => {
    const result = await flush(fetchOperations({}));

    expect(result.data.map((op) => op.id)).toEqual(['OP-5', 'OP-4', 'OP-3', 'OP-2', 'OP-1']);
  });

  it('sorts ascending when requested', async () => {
    const result = await flush(fetchOperations({ sortBy: 'createdAt', sortOrder: 'asc' }));

    expect(result.data.map((op) => op.id)).toEqual(['OP-1', 'OP-2', 'OP-3', 'OP-4', 'OP-5']);
  });

  it('sorts by updatedAt when requested', async () => {
    const result = await flush(fetchOperations({ sortBy: 'updatedAt', sortOrder: 'asc' }));

    expect(result.data.map((op) => op.id)).toEqual(['OP-1', 'OP-2', 'OP-3', 'OP-4', 'OP-5']);
  });

  it('paginates the sorted result with page and limit', async () => {
    const result = await flush(fetchOperations({ page: 2, limit: 2 }));

    expect(result.data.map((op) => op.id)).toEqual(['OP-3', 'OP-2']);
    expect(result.total).toBe(5); // total هو عدد النتائج كاملة قبل الـ slicing
  });

  it('throws a network error when error simulation is enabled and triggered', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1); // أقل من عتبة 0.15

    const promise = fetchOperations({}, undefined, true);
    const assertion = expect(promise).rejects.toThrow('Failed to fetch operations');
    await vi.advanceTimersByTimeAsync(1300);
    await assertion;
  });

  it('does not throw when error simulation is disabled even with a low random value', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);

    const result = await flush(fetchOperations({}, undefined, false));

    expect(result.data).toHaveLength(5);
  });

  it('rejects with an AbortError when the request is aborted mid-flight', async () => {
    const controller = new AbortController();
    const promise = fetchOperations({}, controller.signal, false);
    const assertion = expect(promise).rejects.toMatchObject({ name: 'AbortError' });

    await vi.advanceTimersByTimeAsync(100);
    controller.abort();
    await assertion;
  });
});

describe('updateOperationStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    seedData();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('updates the status, refreshes updatedAt, and persists to storage', async () => {
    const promise = updateOperationStatus('OP-2', 'Completed');
    await vi.advanceTimersByTimeAsync(500);
    const updated = await promise;

    expect(updated.status).toBe('Completed');
    expect(updated.updatedAt).toEqual(expect.any(String));
    expect(saveMock).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 'OP-2', status: 'Completed' })])
    );
  });

  it('rejects when the operation does not exist', async () => {
    const promise = updateOperationStatus('OP-999', 'Completed');
    const assertion = expect(promise).rejects.toThrow('Operation not found');
    await vi.advanceTimersByTimeAsync(500);
    await assertion;

    expect(saveMock).not.toHaveBeenCalled();
  });
});
