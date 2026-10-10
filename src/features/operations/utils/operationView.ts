import type { Operation } from "../types/operation.types";

/** Presentation shape: API operation + formatted fields the table/modals render. */
export type OperationView = Operation & {
  initials: string;
  created: string;
  createdTime: string;
  updated: string;
  updatedTime: string;
};

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

export const getInitials = (name: string) =>
  name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();

export function toView(operation: Operation): OperationView {
  return {
    ...operation,
    initials: getInitials(operation.assignee),
    created: formatDate(operation.createdAt),
    createdTime: formatTime(operation.createdAt),
    updated: formatDate(operation.updatedAt),
    updatedTime: formatTime(operation.updatedAt),
  };
}
