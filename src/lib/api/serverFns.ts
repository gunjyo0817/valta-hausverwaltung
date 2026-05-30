import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getDemoUser } from "@/server/auth/demo";
import {
  classifyUrgency,
  detectMissingInfo,
  generateIntakeFollowUp,
  generateReplyDraft,
  generateSummary,
  structureIntake,
  suggestContractor,
  translateText,
} from "@/server/ai/service";
import {
  getContractorById,
  getDashboardData,
  getPropertyById,
  getTicketById,
  listApprovals,
  listContractors,
  listInvoices,
  listNotifications,
  listProperties,
  listTickets,
} from "@/server/read/queries";
import { updateApprovalDecision } from "@/server/write/approvals";
import { addDocumentMetadata } from "@/server/write/documents";
import { createTicket } from "@/server/write/tickets";
import { assignContractor } from "@/server/write/assignments";
import { updateContractorJob } from "@/server/write/contractorActions";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/server/write/notifications";
import {
  addTicketEvent,
  approveTicketReply,
  requestMissingInfo,
  updateTicketStatus,
} from "@/server/write/ticketActions";

const roleInput = z.object({
  role: z.enum(["pm", "tenant", "contractor", "owner"]),
});

const idInput = z.object({
  id: z.string().min(1),
});

const scopedIdInput = idInput.merge(roleInput);

const createTicketInput = z.object({
  title: z.string().optional(),
  category: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  tenant: z.string().min(1),
  propertyId: z.string().min(1),
  unit: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  description: z.string().min(1),
  contractor: z.string().optional(),
  confidence: z.number().optional(),
  access: z.string().optional(),
  preferred: z.string().optional(),
  photos: z.number().optional(),
  attachments: z.array(z.object({
    name: z.string().min(1),
    type: z.string().min(1),
    url: z.string().optional().nullable(),
  })).optional(),
  language: z.enum(["DE", "EN"]).optional(),
});

const ticketStatusInput = z.enum(["new", "waiting", "in_progress", "contractor_assigned", "resolved"]);

const addTicketEventInput = z.object({
  ticketId: z.string().min(1),
  type: z.enum(["tenant", "ai", "manager", "contractor", "system"]),
  text: z.string().min(1),
  role: z.enum(["pm", "tenant", "contractor", "owner"]).optional(),
  actorName: z.string().optional(),
  status: ticketStatusInput.optional(),
});

const approveTicketReplyInput = z.object({
  ticketId: z.string().min(1),
  text: z.string().min(1),
  role: z.enum(["pm", "tenant", "contractor", "owner"]).optional(),
});

const requestMissingInfoInput = approveTicketReplyInput;

const updateTicketStatusInput = z.object({
  ticketId: z.string().min(1),
  status: ticketStatusInput,
  role: z.enum(["pm", "tenant", "contractor", "owner"]).optional(),
  note: z.string().optional(),
});

const assignContractorInput = z.object({
  ticketId: z.string().min(1),
  contractorId: z.string().min(1),
  role: z.enum(["pm", "tenant", "contractor", "owner"]).optional(),
});

const markNotificationReadInput = z.object({
  id: z.string().min(1),
  role: z.enum(["pm", "tenant", "contractor", "owner"]).optional(),
});

const markAllNotificationsReadInput = z.object({
  role: z.enum(["pm", "tenant", "contractor", "owner"]).optional(),
});

const contractorJobActionInput = z.object({
  ticketId: z.string().min(1),
  action: z.enum(["accept", "start", "request_info", "complete"]),
  message: z.string().optional(),
  role: z.enum(["pm", "tenant", "contractor", "owner"]).optional(),
});

const approvalDecisionInput = z.object({
  id: z.string().min(1),
  status: z.enum(["approved", "rejected", "clarification_requested"]),
  role: z.enum(["pm", "tenant", "contractor", "owner"]).optional(),
});

const addDocumentMetadataInput = z.object({
  scope: z.enum(["ticket", "property"]),
  targetId: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
  url: z.string().optional().nullable(),
  role: z.enum(["pm", "tenant", "contractor", "owner"]).optional(),
});

const aiLanguageInput = z.enum(["DE", "EN"]);

const structureIntakeInput = z.object({
  raw: z.string().min(1),
  language: aiLanguageInput.optional(),
});

const intakeFollowUpInput = z.object({
  raw: z.string().min(1),
  language: aiLanguageInput.optional(),
  step: z.number().int().min(0).optional(),
});

const classifyUrgencyInput = z.object({
  text: z.string().min(1),
  ticketId: z.string().min(1).optional().nullable(),
  language: aiLanguageInput.optional(),
});

const aiTicketInput = z.object({
  ticketId: z.string().min(1),
  language: aiLanguageInput.optional(),
  ticket: z.any().optional(),
});

const suggestContractorInput = z.object({
  category: z.string().min(1),
  ticketId: z.string().min(1).optional().nullable(),
  language: aiLanguageInput.optional(),
});

const translateTextInput = z.object({
  text: z.string().min(1),
  from: aiLanguageInput.optional(),
  to: aiLanguageInput,
});

export const getMeFn = createServerFn({ method: "GET" })
  .inputValidator(roleInput)
  .handler(({ data }) => getDemoUser(data));

export const getDashboardDataFn = createServerFn({ method: "GET" })
  .inputValidator(roleInput)
  .handler(({ data }) => getDashboardData(data));

export const listTicketsFn = createServerFn({ method: "GET" })
  .inputValidator(roleInput)
  .handler(({ data }) => listTickets(data));

export const getTicketByIdFn = createServerFn({ method: "GET" })
  .inputValidator(scopedIdInput)
  .handler(({ data }) => getTicketById(data.id, data));

export const listPropertiesFn = createServerFn({ method: "GET" })
  .inputValidator(roleInput)
  .handler(({ data }) => listProperties(data));

export const getPropertyByIdFn = createServerFn({ method: "GET" })
  .inputValidator(scopedIdInput)
  .handler(({ data }) => getPropertyById(data.id, data));

export const listContractorsFn = createServerFn({ method: "GET" })
  .inputValidator(roleInput)
  .handler(({ data }) => listContractors(data));

export const getContractorByIdFn = createServerFn({ method: "GET" })
  .inputValidator(scopedIdInput)
  .handler(({ data }) => getContractorById(data.id, data));

export const listNotificationsFn = createServerFn({ method: "GET" })
  .inputValidator(roleInput)
  .handler(({ data }) => listNotifications(data));

export const listApprovalsFn = createServerFn({ method: "GET" })
  .inputValidator(roleInput)
  .handler(({ data }) => listApprovals(data));

export const listInvoicesFn = createServerFn({ method: "GET" })
  .inputValidator(roleInput)
  .handler(({ data }) => listInvoices(data));

export const createTicketFn = createServerFn({ method: "POST" })
  .inputValidator(createTicketInput)
  .handler(({ data }) => createTicket(data));

export const addTicketEventFn = createServerFn({ method: "POST" })
  .inputValidator(addTicketEventInput)
  .handler(({ data }) => addTicketEvent(data));

export const approveTicketReplyFn = createServerFn({ method: "POST" })
  .inputValidator(approveTicketReplyInput)
  .handler(({ data }) => approveTicketReply(data));

export const requestMissingInfoFn = createServerFn({ method: "POST" })
  .inputValidator(requestMissingInfoInput)
  .handler(({ data }) => requestMissingInfo(data));

export const updateTicketStatusFn = createServerFn({ method: "POST" })
  .inputValidator(updateTicketStatusInput)
  .handler(({ data }) => updateTicketStatus(data));

export const assignContractorFn = createServerFn({ method: "POST" })
  .inputValidator(assignContractorInput)
  .handler(({ data }) => assignContractor(data));

export const markNotificationReadFn = createServerFn({ method: "POST" })
  .inputValidator(markNotificationReadInput)
  .handler(({ data }) => markNotificationRead(data));

export const markAllNotificationsReadFn = createServerFn({ method: "POST" })
  .inputValidator(markAllNotificationsReadInput)
  .handler(({ data }) => markAllNotificationsRead(data));

export const updateContractorJobFn = createServerFn({ method: "POST" })
  .inputValidator(contractorJobActionInput)
  .handler(({ data }) => updateContractorJob(data));

export const updateApprovalDecisionFn = createServerFn({ method: "POST" })
  .inputValidator(approvalDecisionInput)
  .handler(({ data }) => updateApprovalDecision(data));

export const addDocumentMetadataFn = createServerFn({ method: "POST" })
  .inputValidator(addDocumentMetadataInput)
  .handler(({ data }) => addDocumentMetadata(data));

export const structureIntakeFn = createServerFn({ method: "POST" })
  .inputValidator(structureIntakeInput)
  .handler(({ data }) => structureIntake(data));

export const generateIntakeFollowUpFn = createServerFn({ method: "POST" })
  .inputValidator(intakeFollowUpInput)
  .handler(({ data }) => generateIntakeFollowUp(data));

export const classifyUrgencyFn = createServerFn({ method: "POST" })
  .inputValidator(classifyUrgencyInput)
  .handler(({ data }) => classifyUrgency(data));

export const generateSummaryFn = createServerFn({ method: "POST" })
  .inputValidator(aiTicketInput)
  .handler(({ data }) => generateSummary(data));

export const suggestContractorFn = createServerFn({ method: "POST" })
  .inputValidator(suggestContractorInput)
  .handler(({ data }) => suggestContractor(data));

export const generateReplyDraftFn = createServerFn({ method: "POST" })
  .inputValidator(aiTicketInput)
  .handler(({ data }) => generateReplyDraft(data));

export const detectMissingInfoFn = createServerFn({ method: "POST" })
  .inputValidator(aiTicketInput)
  .handler(({ data }) => detectMissingInfo(data));

export const translateTextFn = createServerFn({ method: "POST" })
  .inputValidator(translateTextInput)
  .handler(({ data }) => translateText(data));
