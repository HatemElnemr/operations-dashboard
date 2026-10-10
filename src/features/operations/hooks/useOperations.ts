import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { fetchOperations, updateOperationStatus } from '../api/operationsApi';
import type { OperationStatus } from '../types/operation.types';

export function useOperations() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // قراءة الفلاتر الحالية من الـ URL (تضمن الحفاظ عليها عند فتح التفاصيل والرجوع)
  const search = searchParams.get('search') || '';
  const status = (searchParams.get('status') as OperationStatus | 'All') || 'All';
  const sortBy = (searchParams.get('sortBy') as 'createdAt' | 'updatedAt') || 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

  // دالة لتحديث الـ URL عند تغيير الفلاتر
  const updateFilters = (newParams: Record<string, string | null>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === null || value === '' || value === 'All') {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      });
      return next;
    });
  };

  // 1. Fetching Operations with React Query
  const query = useQuery({
    queryKey: ['operations', { search, status, sortBy, sortOrder }],
    queryFn: ({ signal }) =>
      fetchOperations(
        { search, status, sortBy, sortOrder },
        signal,
        true // تفعيل الفشل العشوائي للاختبار
      ),
    staleTime: 1000 * 60, // Caching لمدة دقيقة
  });

  // 2. Mutation لتغيير الحالة
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: OperationStatus }) =>
      updateOperationStatus(id, newStatus),
    onSuccess: () => {
      // إعادة جلب البيانات فوراً وتحديث الإحصائيات
      queryClient.invalidateQueries({ queryKey: ['operations'] });
    },
  });

  return {
    // Data & States
    operations: query.data?.data || [],
    total: query.data?.total || 0,
    stats: query.data?.stats || { Pending: 0, Running: 0, Completed: 0, Failed: 0 },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,

    // Filter Controls
    filters: { search, status, sortBy, sortOrder },
    setSearch: (val: string) => updateFilters({ search: val }),
    setStatus: (val: OperationStatus | 'All') => updateFilters({ status: val }),
    setSortBy: (val: 'createdAt' | 'updatedAt') => updateFilters({ sortBy: val }),
    setSortOrder: (val: 'asc' | 'desc') => updateFilters({ sortOrder: val }),

    // Actions
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdating: updateStatusMutation.isPending,
  };
}