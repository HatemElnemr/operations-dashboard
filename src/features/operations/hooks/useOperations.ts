// src/features/operations/hooks/useOperations.ts
import { useCallback } from 'react';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { fetchOperations, updateOperationStatus } from '../api/operationsApi';
import type { OperationStatus } from '../types/operation.types';

export const PAGE_SIZE = 25;

export function useOperations() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // قراءة الفلاتر الحالية والـ Pagination من الـ URL
  const search = searchParams.get('search') || '';
  const status = (searchParams.get('status') as OperationStatus | 'All') || 'All';
  const sortBy = (searchParams.get('sortBy') as 'createdAt' | 'updatedAt') || 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || String(PAGE_SIZE), 10);

  // دالة لتحديث الـ URL عند تغيير الفلاتر أو الصفحة
  const updateFilters = useCallback(
    (newParams: Record<string, string | number | null>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(newParams).forEach(([key, value]) => {
          if (value === null || value === '' || value === 'All' || (key === 'page' && value === 1)) {
            next.delete(key);
          } else {
            next.set(key, String(value));
          }
        });
        return next;
      });
    },
    [setSearchParams]
  );

  // 1. Fetching Operations مع Suspense (يرمي Promise أثناء التحميل و Error للـ ErrorBoundary)
  const query = useSuspenseQuery({
    queryKey: ['operations', { search, status, sortBy, sortOrder, page, limit }],
    queryFn: ({ signal }) =>
      fetchOperations(
        { search, status, sortBy, sortOrder, page, limit },
        signal,
        true // تفعيل محاكاة فشل الشبكة للاختبار
      ),
    staleTime: 1000 * 60,
    retry: 1,
  });

  // 2. Mutation لتغيير الحالة وتحديث الـ Cache فوراً
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: OperationStatus }) =>
      updateOperationStatus(id, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations'] });
    },
  });

  return {
    // Data (متوفرة دائماً في useSuspenseQuery)
    operations: query.data.data,
    total: query.data.total,
    stats: query.data.stats,
    isFetching: query.isFetching,

    // Filter & Pagination Values
    filters: { search, status, sortBy, sortOrder, page, limit },

    // Setters (تحديث الـ URL مباشرة)
    setSearch: useCallback((val: string) => updateFilters({ search: val, page: 1 }), [updateFilters]),
    setStatus: useCallback((val: OperationStatus | 'All') => updateFilters({ status: val, page: 1 }), [updateFilters]),
    setSortBy: useCallback((val: 'createdAt' | 'updatedAt') => updateFilters({ sortBy: val }), [updateFilters]),
    setSortOrder: useCallback((val: 'asc' | 'desc') => updateFilters({ sortOrder: val }), [updateFilters]),
    setPage: useCallback((val: number) => updateFilters({ page: val }), [updateFilters]),

    // Actions
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdating: updateStatusMutation.isPending,
    updateError: updateStatusMutation.error,
  };
}
