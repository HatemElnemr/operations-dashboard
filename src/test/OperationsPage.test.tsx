import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NavigateFunction } from 'react-router-dom';
import { fetchOperations, updateOperationStatus } from '../features/operations/api/operationsApi';
import OperationsPage from '../features/operations/pages/OperationsPage';
import {
  createDeferred,
  createMockApi,
  makeOperation,
  makeResponse,
  renderWithProviders,
  type Deferred,
} from './testUtils';
import type { OperationsFetchParams, OperationsResponse } from '../features/operations/types/operation.types';

// نستبدل طبقة الـ API كاملة بنسخة خاضعة للتحكم (بيانات + توقيت + فشل)
vi.mock('../features/operations/api/operationsApi', () => ({
  fetchOperations: vi.fn(),
  updateOperationStatus: vi.fn(),
}));

const fetchMock = vi.mocked(fetchOperations);
const updateMock = vi.mocked(updateOperationStatus);

/** ينتظر انتهاء الـ debounce (300ms) داخل act لتفادي تحذيرات React. */
async function flushDebounce() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 350));
  });
}

function renderPage(options: { route?: string; captureNavigate?: (navigate: NavigateFunction) => void } = {}) {
  return renderWithProviders(<OperationsPage />, options);
}

/** بطاقة إحصائية معينة داخل قسم الملخص. */
function statCard(status: string) {
  const section = screen.getByRole('region', { name: /operation status summary/i });
  return within(section).getByText(status).closest('article') as HTMLElement;
}

function searchInput() {
  return screen.getByPlaceholderText('Search by ID or name');
}

describe('OperationsPage integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Requirement 1: Combined Search and Filtering
  // -------------------------------------------------------------------------
  describe('combined search and filtering', () => {
    const dataset = [
      makeOperation('OP-1', { name: 'Payment Processing Job', status: 'Running' }),
      makeOperation('OP-2', { name: 'Payment Reconciliation', status: 'Pending' }),
      makeOperation('OP-3', { name: 'Database Backup Service', status: 'Running' }),
      makeOperation('OP-4', { name: 'Report Generation', status: 'Completed' }),
    ];

    it('narrows the list to rows matching BOTH the search query and the status filter', async () => {
      const api = createMockApi(dataset);
      fetchMock.mockImplementation(api.fetchOperations);
      const user = userEvent.setup();
      renderPage();

      // الحالة الأولية: كل الصفوف ظاهرة
      expect(await screen.findByText('OP-1')).toBeInTheDocument();
      expect(screen.getByText('OP-2')).toBeInTheDocument();

      // 1) البحث "payment" يطابق OP-1 و OP-2 فقط
      await user.type(searchInput(), 'payment');
      await flushDebounce();
      await waitFor(() => {
        expect(screen.getByText('OP-1')).toBeInTheDocument();
        expect(screen.getByText('OP-2')).toBeInTheDocument();
      });
      expect(screen.queryByText('OP-3')).not.toBeInTheDocument();
      expect(screen.queryByText('OP-4')).not.toBeInTheDocument();

      // 2) إضافة فلتر Running يضيّق النتيجة لـ OP-1 فقط (Intersection)
      await user.selectOptions(screen.getByRole('combobox', { name: /filter by status/i }), 'Running');
      await waitFor(() => {
        expect(fetchMock).toHaveBeenLastCalledWith(
          expect.objectContaining({ search: 'payment', status: 'Running' }),
          expect.anything(),
          true
        );
      });

      await waitFor(() => {
        expect(screen.getByText('OP-1')).toBeInTheDocument();
        expect(screen.queryByText('OP-2')).not.toBeInTheDocument();
      });
      expect(screen.queryByText('OP-3')).not.toBeInTheDocument();

      // الإحصائيات تظل عامة (Running = 2 في كامل البيانات) حتى مع فلترة الجدول
      expect(within(statCard('Running')).getByText('2')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Requirement 2: Status Update & Stats Recalculation
  // -------------------------------------------------------------------------
  describe('status update and stats recalculation', () => {
    const dataset = [
      makeOperation('OP-1', { name: 'Payment Processing Job', status: 'Pending' }),
      makeOperation('OP-2', { name: 'Vendor Sync', status: 'Running' }),
      makeOperation('OP-3', { name: 'Q2 Compliance Audit', status: 'Completed' }),
      makeOperation('OP-4', { name: 'Customer Data Migration', status: 'Failed' }),
    ];

    it('updates the status badge in the list/modal and recalculates the stat cards', async () => {
      const api = createMockApi(dataset);
      fetchMock.mockImplementation(api.fetchOperations);
      updateMock.mockImplementation(api.updateOperationStatus);
      const user = userEvent.setup();
      renderPage();

      await screen.findByText('OP-1');

      // الإحصائيات قبل التغيير: كل حالة = 1
      expect(within(statCard('Pending')).getByText('1')).toBeInTheDocument();
      expect(within(statCard('Completed')).getByText('1')).toBeInTheDocument();

      // فتح مودال تعديل العملية Pending
      const row = screen.getByText('OP-1').closest('tr')!;
      await user.click(within(row).getByRole('button', { name: /edit/i }));

      const dialog = screen.getByRole('dialog');
      await user.click(within(dialog).getByRole('radio', { name: 'Completed' }));
      await user.click(within(dialog).getByRole('button', { name: /save changes/i }));

      // نداء الـ Mutation بالقيم الصحيحة
      expect(updateMock).toHaveBeenCalledWith('OP-1', 'Completed');

      // المودال يُغلق والـ Cache يُعاد جلبه: الشارة والبطاقات تتحدثان
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      const updatedRow = screen.getByText('OP-1').closest('tr')!;
      await waitFor(() => {
        expect(within(updatedRow).getByText('Completed')).toBeInTheDocument();
        expect(within(statCard('Pending')).getByText('0')).toBeInTheDocument();
        expect(within(statCard('Completed')).getByText('2')).toBeInTheDocument();
      });

      // فتح المودال مجدداً يعرض الحالة الجديدة كمُحددة مسبقاً
      await user.click(within(updatedRow).getByRole('button', { name: /edit/i }));
      const reopened = screen.getByRole('dialog');
      expect(within(reopened).getByRole('radio', { name: 'Completed' })).toBeChecked();
      await user.click(within(reopened).getByRole('button', { name: /cancel/i }));
    });
  });

  // -------------------------------------------------------------------------
  // Requirement 3: API Failure Handling
  // -------------------------------------------------------------------------
  describe('API failure handling', () => {
    const dataset = [makeOperation('OP-1', { name: 'Payment Processing Job', status: 'Running' })];

    it('shows an error state with a working retry action when fetching fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const api = createMockApi(dataset);

      // كل المحاولات تفشل في البداية
      fetchMock.mockRejectedValue(new Error('Failed to fetch operations. Server connection timed out.'));
      const user = userEvent.setup();
      renderPage();

      // الواجهة تظهر خطأً بدل الـ crash (مع retry:1 يعني محاولتين)
      const alert = await screen.findByRole('alert', {}, { timeout: 4000 });
      expect(alert).toHaveTextContent('Failed to load operations');
      expect(within(alert).getByRole('button', { name: /try again/i })).toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(screen.queryByText('OP-1')).not.toBeInTheDocument();

      // "Try again" يعيد ضبط الـ Query ويعيد الجلب بنجاح
      fetchMock.mockImplementation(api.fetchOperations);
      await user.click(within(alert).getByRole('button', { name: /try again/i }));

      expect(await screen.findByText('OP-1')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });
  });

  // -------------------------------------------------------------------------
  // Requirement 4: Out-of-Order / Race Condition Handling
  // -------------------------------------------------------------------------
  describe('out-of-order response handling', () => {
    interface FetchCall {
      params: OperationsFetchParams;
      deferred: Deferred<OperationsResponse>;
    }

    /** كل استدعاء جلب يعلّق حتى يُحل يدوياً — للتحكم الكامل في ترتيب الردود. */
    function installDeferredFetch() {
      const calls: FetchCall[] = [];
      fetchMock.mockImplementation((params: OperationsFetchParams) => {
        const deferred = createDeferred<OperationsResponse>();
        calls.push({ params, deferred });
        return deferred.promise;
      });
      return calls;
    }

    it('does not let a stale, slower response overwrite newer search results', async () => {
      const calls = installDeferredFetch();
      let navigate!: NavigateFunction;
      renderPage({ captureNavigate: (n) => (navigate = n) });

      // الرد الأولي بالقائمة الكاملة
      await act(async () => {
        calls[0].deferred.resolve(
          makeResponse([
            makeOperation('OP-1', { name: 'Inventory reconciliation' }),
            makeOperation('OP-2', { name: 'Vendor payment processing' }),
          ])
        );
      });
      expect(await screen.findByText('OP-1')).toBeInTheDocument();

      // بحث "alpha" — الرد يبقى معلّقاً (قديم وبطيء)
      await act(async () => {
        navigate('/?search=alpha');
      });
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
      expect(calls[1].params.search).toBe('alpha');

      // بحث أحدث "beta" يُطلق قبل وصول رد "alpha"
      await act(async () => {
        navigate('/?search=beta');
      });
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
      expect(calls[2].params.search).toBe('beta');

      // رد "beta" الأحدث يصل أولاً ويُعرض
      await act(async () => {
        calls[2].deferred.resolve(makeResponse([makeOperation('OP-7', { name: 'Beta result' })]));
      });
      expect(await screen.findByText('OP-7')).toBeInTheDocument();

      // رد "alpha" الأقدم يصل الآن (بعد الأحدث) — لا ي overwrite النتائج الأحدث
      await act(async () => {
        calls[1].deferred.resolve(makeResponse([makeOperation('OP-9', { name: 'Alpha stale result' })]));
      });

      expect(screen.queryByText('OP-9')).not.toBeInTheDocument();
      expect(screen.getByText('OP-7')).toBeInTheDocument();
      expect(screen.queryByText('OP-1')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Requirement 5: Prevention of Stale Data on New Search
  // -------------------------------------------------------------------------
  describe('prevention of stale data on a new search', () => {
    const dataset = [
      makeOperation('OP-1', { name: 'Inventory reconciliation', status: 'Running' }),
      makeOperation('OP-2', { name: 'Vendor payment processing', status: 'Pending' }),
      makeOperation('OP-3', { name: 'Database backup service', status: 'Completed' }),
      makeOperation('OP-4', { name: 'Cache invalidation', status: 'Failed' }),
    ];

    it('clears previous results and pending states completely when a new search runs', async () => {
      const api = createMockApi(dataset);
      fetchMock.mockImplementation(api.fetchOperations);
      const user = userEvent.setup();
      renderPage();

      // النتائج الأولية ظاهرة
      expect(await screen.findByText('OP-1')).toBeInTheDocument();
      expect(screen.getByText('OP-3')).toBeInTheDocument();

      // بحث جديد "backup" — الرد معلّق. التنقّل داخل startTransition فيحتفظ
      // بالصفوف القديمة مؤقتاً مع مؤشر "Updating…" بدلاً من وميض الـ skeleton
      const deferredCall = createDeferred<OperationsResponse>();
      fetchMock.mockImplementation((params: OperationsFetchParams) => {
        if (params.search === 'backup') return deferredCall.promise;
        return api.fetchOperations(params);
      });

      await user.type(searchInput(), 'backup');
      await flushDebounce();
      // التنقّل داخل startTransition: الواجهة تحتفظ بالسابق ويُطلق طلب جديد للـ URL
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(fetchMock).toHaveBeenLastCalledWith(
          expect.objectContaining({ search: 'backup' }),
          expect.anything(),
          true
        );
      });

      // الرد يصل: الصف الوحيد المطابق يظهر ولا شيء من القديم يبقى
      await act(async () => {
        deferredCall.resolve(makeResponse([makeOperation('OP-3', { name: 'Database backup service' })]));
      });

      await waitFor(() => {
        expect(screen.getByText('OP-3')).toBeInTheDocument();
        // لا يبقى أي سجل من البحث السابق على الشاشة
        expect(screen.queryByText('OP-1')).not.toBeInTheDocument();
        expect(screen.queryByText('OP-2')).not.toBeInTheDocument();
        expect(screen.queryByText('OP-4')).not.toBeInTheDocument();
        expect(screen.queryByText('Updating…')).not.toBeInTheDocument();
      });

      // بحث بلا نتائج: EmptyState بدل بقاء السجلات القديمة
      await user.clear(searchInput());
      await user.type(searchInput(), 'nothing-matches-this');
      await flushDebounce();

      expect(await screen.findByText('No operations found')).toBeInTheDocument();
      expect(screen.queryByText('OP-3')).not.toBeInTheDocument();
    });
  });
});
