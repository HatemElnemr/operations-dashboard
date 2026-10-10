export type OperationStatus = 'Pending' | 'Running' | 'Completed' | 'Failed';

export interface Operation {
  id: string;
  name: string;
  assignee: string;
  status: OperationStatus;
  createdAt: string; // ISO String format
  updatedAt: string; // ISO String format
}

export interface OperationsFetchParams {
  search?: string;
  status?: OperationStatus | 'All';
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface OperationsResponse {
  data: Operation[];
  total: number;
  stats: Record<OperationStatus, number>;
}