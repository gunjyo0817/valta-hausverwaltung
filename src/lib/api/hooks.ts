import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  classifyUrgencyFn,
  addTicketEventFn,
  clearDemoDataFn,
  addDocumentMetadataFn,
  assignContractorFn,
  approveTicketReplyFn,
  createTicketFn,
  detectMissingInfoFn,
  generateIntakeFollowUpFn,
  generateReplyDraftFn,
  generateSummaryFn,
  getAiInsightsFn,
  getDemoDataStatusFn,
  getMeFn,
  getContractorByIdFn,
  getDashboardDataFn,
  getFinancialSummaryFn,
  getPropertyByIdFn,
  getTicketByIdFn,
  listApprovalsFn,
  listContractorScheduleFn,
  listContractorsFn,
  listInvoicesFn,
  listNotificationsFn,
  listPropertiesFn,
  listTicketsFn,
  markAllNotificationsReadFn,
  markNotificationReadFn,
  requestMissingInfoFn,
  rescheduleAppointmentFn,
  reloadDemoDataFn,
  searchGlobalFn,
  structureIntakeFn,
  suggestContractorFn,
  translateTextFn,
  updateApprovalDecisionFn,
  updateContractorJobFn,
  updateTicketStatusFn,
} from "./serverFns";
import { useRole } from "@/lib/role";
import type { ApprovalDto, NotificationDto, PropertyDto, Role, TicketDto } from "./types";

type PropertyListOptions = {
  query?: string;
  status?: "all" | "healthy" | "attention" | "urgent";
  city?: string;
  limit?: number;
  offset?: number;
};

type ContractorListOptions = {
  query?: string;
  specialtyKey?: string;
  availability?: "all" | "available" | "unavailable";
  limit?: number;
  offset?: number;
};

function withDemoRole<TInput>(input: TInput, role: Role): TInput {
  if (!input || typeof input !== "object" || !("data" in input)) return input;
  const candidate = input as { data?: unknown };
  if (!candidate.data || typeof candidate.data !== "object" || Array.isArray(candidate.data)) return input;
  const data = candidate.data as Record<string, unknown>;
  if ("role" in data) return input;
  return {
    ...(input as Record<string, unknown>),
    data: {
      ...data,
      role,
    },
  } as TInput;
}

export const queryKeys = {
  me: (role: string) => ["me", role] as const,
  dashboard: (role: string) => ["dashboard", role] as const,
  aiInsights: (role: string) => ["aiInsights", role] as const,
  globalSearch: (role: string, query: string) => ["globalSearch", role, query] as const,
  tickets: (role: string) => ["tickets", role] as const,
  ticket: (role: string, id: string) => ["tickets", role, id] as const,
  properties: (role: string, options?: PropertyListOptions) => ["properties", role, options ?? {}] as const,
  property: (role: string, id: string) => ["properties", role, id] as const,
  contractors: (role: string, options?: ContractorListOptions) => ["contractors", role, options ?? {}] as const,
  contractor: (role: string, id: string) => ["contractors", role, id] as const,
  notifications: (role: string) => ["notifications", role] as const,
  approvals: (role: string) => ["approvals", role] as const,
  invoices: (role: string) => ["invoices", role] as const,
  financialSummary: (role: string) => ["financialSummary", role] as const,
  contractorSchedule: (role: string) => ["contractorSchedule", role] as const,
};

function useTicketMutation<TInput>(mutationFn: (input: TInput) => Promise<TicketDto | null>) {
  const queryClient = useQueryClient();
  const { role } = useRole();

  return useMutation({
    mutationFn: (input) => mutationFn(withDemoRole(input, role)),
    onSuccess: async (ticket) => {
      if (ticket) {
        queryClient.setQueriesData<TicketDto[]>({ queryKey: ["tickets"] }, (tickets) =>
          tickets?.map((item) => (item.id === ticket.id ? ticket : item)),
        );
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["tickets"] }),
        queryClient.invalidateQueries({ queryKey: ["properties"] }),
        queryClient.invalidateQueries({ queryKey: ["contractors"] }),
        queryClient.invalidateQueries({ queryKey: ["contractorSchedule"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
        queryClient.invalidateQueries({ queryKey: ["aiInsights"] }),
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

export function useAiInsights() {
  const { role } = useRole();

  return useQuery({
    queryKey: queryKeys.aiInsights(role),
    queryFn: () => getAiInsightsFn({ data: { role } }),
  });
}

export function useGlobalSearch(query: string) {
  const { role } = useRole();
  const normalized = query.trim();

  return useQuery({
    queryKey: queryKeys.globalSearch(role, normalized),
    queryFn: () => searchGlobalFn({ data: { query: normalized, role, limit: 8 } }),
    enabled: normalized.length >= 2,
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

export function useProperties(options: PropertyListOptions = {}) {
  const { role } = useRole();

  return useQuery({
    queryKey: queryKeys.properties(role, options),
    queryFn: () => listPropertiesFn({ data: { role, ...options } }),
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

export function useContractors(options: ContractorListOptions = {}) {
  const { role } = useRole();

  return useQuery({
    queryKey: queryKeys.contractors(role, options),
    queryFn: () => listContractorsFn({ data: { role, ...options } }),
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

export function useFinancialSummary() {
  const { role } = useRole();

  return useQuery({
    queryKey: queryKeys.financialSummary(role),
    queryFn: () => getFinancialSummaryFn({ data: { role } }),
  });
}

export function useContractorSchedule() {
  const { role } = useRole();

  return useQuery({
    queryKey: queryKeys.contractorSchedule(role),
    queryFn: () => listContractorScheduleFn({ data: { role } }),
  });
}

export function useDemoDataStatus() {
  return useQuery({
    queryKey: ["demo-data-status"],
    queryFn: () => getDemoDataStatusFn(),
  });
}

function useNotificationMutation<TInput>(mutationFn: (input: TInput) => Promise<NotificationDto[]>) {
  const queryClient = useQueryClient();
  const { role } = useRole();

  return useMutation({
    mutationFn: (input) => mutationFn(withDemoRole(input, role)),
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
    mutationFn: (input: Parameters<typeof createTicketFn>[0]) => createTicketFn(withDemoRole(input, role)),
    onSuccess: async (ticket) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["tickets"] }),
        queryClient.invalidateQueries({ queryKey: ["properties"] }),
        queryClient.invalidateQueries({ queryKey: ["contractors"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
        queryClient.invalidateQueries({ queryKey: ["aiInsights"] }),
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

export function useRescheduleAppointment() {
  return useTicketMutation(rescheduleAppointmentFn);
}

export function useUpdateApprovalDecision() {
  const queryClient = useQueryClient();
  const { role } = useRole();

  return useMutation({
    mutationFn: (input: Parameters<typeof updateApprovalDecisionFn>[0]) => updateApprovalDecisionFn(withDemoRole(input, role)),
    onSuccess: async (approvals: ApprovalDto[]) => {
      queryClient.setQueryData(queryKeys.approvals(role), approvals);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
        queryClient.invalidateQueries({ queryKey: ["financialSummary"] }),
        queryClient.invalidateQueries({ queryKey: ["aiInsights"] }),
      ]);
    },
  });
}

export function useAddDocumentMetadata() {
  const queryClient = useQueryClient();
  const { role } = useRole();

  return useMutation({
    mutationFn: (input: Parameters<typeof addDocumentMetadataFn>[0]) => addDocumentMetadataFn(withDemoRole(input, role)),
    onSuccess: async (result, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["tickets"] }),
        queryClient.invalidateQueries({ queryKey: ["properties"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
        queryClient.invalidateQueries({ queryKey: ["aiInsights"] }),
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

export function useStructureIntake() {
  return useAiMutation(structureIntakeFn);
}

export function useGenerateIntakeFollowUp() {
  return useAiMutation(generateIntakeFollowUpFn);
}

export function useClassifyUrgency() {
  return useAiMutation(classifyUrgencyFn);
}

export function useGenerateSummary() {
  return useAiMutation(generateSummaryFn);
}

export function useSuggestContractor() {
  return useAiMutation(suggestContractorFn);
}

export function useGenerateReplyDraft() {
  return useAiMutation(generateReplyDraftFn);
}

export function useDetectMissingInfo() {
  return useAiMutation(detectMissingInfoFn);
}

export function useTranslateText() {
  return useAiMutation(translateTextFn);
}

function useAiMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aiInsights"] });
    },
  });
}

function useDemoDataMutation<TInput>(mutationFn: (input: TInput) => Promise<unknown>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
  });
}

export function useClearDemoData() {
  return useDemoDataMutation(clearDemoDataFn);
}

export function useReloadDemoData() {
  return useDemoDataMutation(reloadDemoDataFn);
}

export function useMarkNotificationRead() {
  return useNotificationMutation(markNotificationReadFn);
}

export function useMarkAllNotificationsRead() {
  return useNotificationMutation(markAllNotificationsReadFn);
}
