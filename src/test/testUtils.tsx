import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import type { ReactElement } from 'react';
import { MemoryRouter, useNavigate, type NavigateFunction } from 'react-router-dom';
import type {
  Operation,
  OperationStatus,
  OperationsFetchParams,
  OperationsResponse,
} from '../features/operations/types/operation.types';

/** Deterministic operation factory — override only what a test cares about. */
export function makeOperation(id: string, overrides: Partial<Operation> = {}): Operation {
  return {
    id,
    name: `Operation ${id}`,
    description: `Description for ${id}.`,
    assignee: 'Ahmed Hassan',
    role: 'Operations Lead',
    status: 'Pending',
    createdAt: '2025-05-01T09:00:00.000Z',
    updatedAt: '2025-05-02T15:00:00.000Z',
    ...overrides,
  };
}

export function countStats(data: Operation[]): Record<OperationStatus, number> {
  const stats: Record<OperationStatus, number> = { Pending: 0, Running: 0, Completed: 0, Failed: 0 };
  data.forEach((op) => {
    stats[op.status]++;
  });
  return stats;
}

/** Build a fetch response; `total` defaults to the page length (unfiltered total can be larger). */
export function makeResponse(data: Operation[], total: number = data.length): OperationsResponse {
  return { data, total, stats: countStats(data) };
}

/** Manually controlled promise, used to dictate exactly when a "network" call resolves. */
export interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

export function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, retryDelay: 0, gcTime: Infinity, staleTime: Infinity },
      mutations: { retry: false },
    },
  });
}

/** Render a feature element inside the providers the app supplies (QueryClient + Router). */
export function renderWithProviders(
  ui: ReactElement,
  { route = '/', captureNavigate }: { route?: string; captureNavigate?: (navigate: NavigateFunction) => void } = {}
) {
  const queryClient = createTestQueryClient();

  // يلتقط navigate() من الـ Router حتى يتمكن الاختبار من تغيير الـ URL
  // (مفيد لاختبارات سباق الطلبات حيث الـ input معلّق وسط الـ Suspense)
  function NavigateCapture() {
    const navigate = useNavigate();
    captureNavigate?.(navigate);
    return null;
  }

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <NavigateCapture />
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  );
  return { queryClient };
}

export interface MockApi {
  /** Mutable backing store — mutations update it, fetches read from it. */
  db: Operation[];
  fetchOperations: (
    params?: OperationsFetchParams,
    signal?: AbortSignal,
    shouldSimulateErrors?: boolean
  ) => Promise<OperationsResponse>;
  updateOperationStatus: (id: string, newStatus: OperationStatus) => Promise<Operation>;
}

/**
 * In-memory stand-in for the mock API layer: implements the same
 * search/status/sort/pagination/stats semantics as `operationsApi.ts`
 * against a controlled dataset, so integration tests exercise real filtering.
 */
export function createMockApi(initialData: Operation[]): MockApi {
  const db = initialData.map((op) => ({ ...op }));

  const fetchOperations = vi.fn(async (params: OperationsFetchParams = {}) => {
    let result = [...db];
    const stats = countStats(db);

    if (params.search && params.search.trim() !== '') {
      const query = params.search.trim().toLowerCase();
      result = result.filter(
        (op) =>
          op.id.toLowerCase().includes(query) ||
          op.name.toLowerCase().includes(query) ||
          op.assignee.toLowerCase().includes(query)
      );
    }

    if (params.status && params.status !== 'All') {
      result = result.filter((op) => op.status === params.status);
    }

    const sortBy = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'desc';
    result.sort((a, b) => {
      const dateA = new Date(a[sortBy]).getTime();
      const dateB = new Date(b[sortBy]).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 25);

    return {
      data: result.slice((page - 1) * limit, page * limit),
      total: result.length,
      stats,
    } satisfies OperationsResponse;
  });

  const updateOperationStatus = vi.fn(async (id: string, newStatus: OperationStatus) => {
    const index = db.findIndex((op) => op.id === id);
    if (index === -1) {
      throw new Error('Operation not found');
    }
    db[index] = { ...db[index], status: newStatus, updatedAt: new Date().toISOString() };
    return { ...db[index] };
  });

  return { db, fetchOperations, updateOperationStatus };
}
