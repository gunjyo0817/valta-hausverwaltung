import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addTicketEventFn,
  addDocumentMetadataFn,
  assignContractorFn,
  approveTicketReplyFn,
  createTicketFn,
  getMeFn,
  getContractorByIdFn,
  getDashboardDataFn,
  getPropertyByIdFn,
  getTicketByIdFn,
  listApprovalsFn,
  listContractorsFn,
  listInvoicesFn,
  listNotificationsFn,
  listPropertiesFn,
  listTicketsFn,
  markAllNotificationsReadFn,
  markNotificationReadFn,
  requestMissingInfoFn,
  updateApprovalDecisionFn,
  updateContractorJobFn,
  updateTicketStatusFn,
} from "./serverFns";
import { useRole } from "@/lib/role";
import type { ApprovalDto, NotificationDto, PropertyDto, TicketDto } from "./types";

export const queryKeys = {
  me: (role: string) => ["me", role] as const,
  dashboard: (role: string) => ["dashboard", role] as const,
  tickets: (role: string) => ["tickets", role] as const,
  ticket: (role: string, id: string) => ["tickets", role, id] as const,
  properties: (role: string) => ["properties", role] as const,
  property: (role: string, id: string) => ["properties", role, id] as const,
  contractors: (role: string) => ["contractors", role] as const,
  contractor: (role: string, id: string) => ["contractors", role, id] as const,
  notifications: (role: string) => ["notifications", role] as const,
  approvals: (role: string) => ["approvals", role] as const,
  invoices: (role: string) => ["invoices", role] as const,
};

function useTicketMutation<TInput>(mutationFn: (input: TInput) => Promise<TicketDto | null>) {
  const queryClient = useQueryClient();
  const { role } = useRole();

  return useMutation({
    mutationFn,
    onSuccess: async (ticket) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["tickets"] }),
        queryClient.invalidateQueries({ queryKey: ["properties"] }),
        queryClient.invalidateQueries({ queryKey: ["contractors"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
      if (ticket) queryClient.setQueryData(queryKeys.ticket(role, ticket.id), ticket);
    },
  });
}

export function useMe() {
  const { role } = useRole();

  return useQuery({
    queryKey: queryKeys.me(role),
    queryFn: () => getMeFn({ data: { role } }),
  });
}

export function useDashboardData() {
  const { role } = useRole();

  return useQuery({
    queryKey: queryKeys.dashboard(role),
    queryFn: () => getDashboardDataFn({ data: { role } }),
  });
}

export function useTickets() {
  const { role } = useRole();

  return useQuery({
    queryKey: queryKeys.tickets(role),
    queryFn: () => listTicketsFn({ data: { role } }),
  });
}

export function useTicket(id: string) {
  const { role } = useRole();

  return useQuery({
    queryKey: queryKeys.ticket(role, id),
    queryFn: () => getTicketByIdFn({ data: { id, role } }),
    enabled: id.length > 0,
  });
}

export function useProperties() {
  const { role } = useRole();

  return useQuery({
    queryKey: queryKeys.properties(role),
    queryFn: () => listPropertiesFn({ data: { role } }),
  });
}

export function useProperty(id: string) {
  const { role } = useRole();

  return useQuery({
    queryKey: queryKeys.property(role, id),
    queryFn: () => getPropertyByIdFn({ data: { id, role } }),
    enabled: id.length > 0,
  });
}

export function useContractors() {
  const { role } = useRole();

  return useQuery({
    queryKey: queryKeys.contractors(role),
    queryFn: () => listContractorsFn({ data: { role } }),
  });
}

export function useContractor(id: string) {
  const { role } = useRole();

  return useQuery({
    queryKey: queryKeys.contractor(role, id),
    queryFn: () => getContractorByIdFn({ data: { id, role } }),
    enabled: id.length > 0,
  });
}

export function useNotifications() {
  const { role } = useRole();

  return useQuery({
    queryKey: queryKeys.notifications(role),
    queryFn: () => listNotificationsFn({ data: { role } }),
  });
}

export function useApprovals() {
  const { role } = useRole();

  return useQuery({
    queryKey: queryKeys.approvals(role),
    queryFn: () => listApprovalsFn({ data: { role } }),
  });
}

export function useInvoices() {
  const { role } = useRole();

  return useQuery({
    queryKey: queryKeys.invoices(role),
    queryFn: () => listInvoicesFn({ data: { role } }),
  });
}

function useNotificationMutation<TInput>(mutationFn: (input: TInput) => Promise<NotificationDto[]>) {
  const queryClient = useQueryClient();
  const { role } = useRole();

  return useMutation({
    mutationFn,
    onSuccess: (notifications) => {
      queryClient.setQueryData(queryKeys.notifications(role), notifications);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  const { role } = useRole();

  return useMutation({
    mutationFn: createTicketFn,
    onSuccess: async (ticket) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["tickets"] }),
        queryClient.invalidateQueries({ queryKey: ["properties"] }),
        queryClient.invalidateQueries({ queryKey: ["contractors"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
      queryClient.setQueryData(queryKeys.ticket(role, ticket.id), ticket);
    },
  });
}

export function useAddTicketEvent() {
  return useTicketMutation(addTicketEventFn);
}

export function useApproveTicketReply() {
  return useTicketMutation(approveTicketReplyFn);
}

export function useRequestMissingInfo() {
  return useTicketMutation(requestMissingInfoFn);
}

export function useUpdateTicketStatus() {
  return useTicketMutation(updateTicketStatusFn);
}

export function useAssignContractor() {
  return useTicketMutation(assignContractorFn);
}

export function useUpdateContractorJob() {
  return useTicketMutation(updateContractorJobFn);
}

export function useUpdateApprovalDecision() {
  const queryClient = useQueryClient();
  const { role } = useRole();

  return useMutation({
    mutationFn: updateApprovalDecisionFn,
    onSuccess: async (approvals: ApprovalDto[]) => {
      queryClient.setQueryData(queryKeys.approvals(role), approvals);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
    },
  });
}

export function useAddDocumentMetadata() {
  const queryClient = useQueryClient();
  const { role } = useRole();

  return useMutation({
    mutationFn: addDocumentMetadataFn,
    onSuccess: async (result, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["tickets"] }),
        queryClient.invalidateQueries({ queryKey: ["properties"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      ]);

      if (!result) return;
      if (variables.data.scope === "ticket") {
        queryClient.setQueryData(queryKeys.ticket(role, variables.data.targetId), result as TicketDto);
      } else {
        queryClient.setQueryData(queryKeys.property(role, variables.data.targetId), result as PropertyDto);
      }
    },
  });
}

export function useMarkNotificationRead() {
  return useNotificationMutation(markNotificationReadFn);
}

export function useMarkAllNotificationsRead() {
  return useNotificationMutation(markAllNotificationsReadFn);
}
