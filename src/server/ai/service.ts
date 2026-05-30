import { z } from "zod";

import { db } from "@/server/db/client";
import { aiSuggestions } from "@/server/db/schema";
import { getTicketById } from "@/server/read/queries";
import type {
  AiContractorSuggestionDto,
  AiMissingInfoDto,
  AiReplyDraftDto,
  AiStructuredIntakeDto,
  AiSummaryDto,
  AiTranslationDto,
  AiUrgencyDto,
  Lang,
} from "@/lib/api/types";

import { requestOpenAiJson } from "./client";
import {
  classifyUrgencyFallback,
  detectMissingInfoFallback,
  generateReplyDraftFallback,
  generateSummaryFallback,
  structureIntakeFallback,
  suggestContractorFallback,
  translateTextFallback,
} from "./fallbacks";

const ORG_ID = "org-hausverwaltung-berlin";
const FALLBACK_MODEL = "deterministic-fallback";

const statusSchema = z.enum(["generated", "fallback", "failed"]);
type AiSuggestionStatus = z.infer<typeof statusSchema>;
type AiKind =
  | "structure_intake"
  | "classify_urgency"
  | "summary"
  | "contractor_suggestion"
  | "reply_draft"
  | "missing_info"
  | "translation";

const urgencySchema = z.enum(["low", "medium", "high", "critical"]);
const langSchema = z.enum(["DE", "EN"]);

const structureIntakeSchema = z.object({
  title: z.string().default(""),
  category: z.string().default(""),
  priority: urgencySchema.default("medium"),
  tenant: z.string().default(""),
  propertyId: z.string().default("p-lindenstr-22"),
  unit: z.string().default(""),
  phone: z.string().default(""),
  email: z.string().default(""),
  description: z.string().default(""),
  contractor: z.string().default(""),
  confidence: z.number().int().min(0).max(100).default(80),
  access: z.string().default(""),
  preferred: z.string().default(""),
  missing: z.array(z.string()).default([]),
});

const urgencyOutputSchema = z.object({
  priority: urgencySchema,
  confidence: z.number().int().min(0).max(100).default(80),
  reasons: z.array(z.string()).default([]),
});

const contractorOutputSchema = z.object({
  contractor: z.string(),
  contractorId: z.string().optional(),
  confidence: z.number().int().min(0).max(100).default(80),
  reason: z.string().default(""),
});

const summaryOutputSchema = z.object({
  summary: z.string(),
  confidence: z.number().int().min(0).max(100).default(80),
});

const replyDraftOutputSchema = z.object({
  text: z.string(),
  confidence: z.number().int().min(0).max(100).default(80),
});

const missingInfoOutputSchema = z.object({
  text: z.string(),
  items: z.array(z.string()).default([]),
  confidence: z.number().int().min(0).max(100).default(80),
});

const translationOutputSchema = z.object({
  text: z.string(),
  to: langSchema,
  confidence: z.number().int().min(0).max(100).default(80),
});

async function persistAiSuggestion(input: {
  kind: AiKind;
  ticketId?: string | null;
  request: Record<string, unknown>;
  output: Record<string, unknown>;
  model: string;
  status: AiSuggestionStatus;
}) {
  await db.insert(aiSuggestions).values({
    id: `ai-suggestion-${crypto.randomUUID()}`,
    organizationId: ORG_ID,
    ticketId: input.ticketId ?? null,
    kind: input.kind,
    input: input.request,
    output: input.output,
    model: input.model,
    status: input.status,
  });
}

async function runAi<K extends AiKind, T extends Record<string, unknown>>(input: {
  kind: K;
  ticketId?: string | null;
  request: Record<string, unknown>;
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  fallback: T;
}) {
  try {
    const result = await requestOpenAiJson<unknown>({
      system: input.system,
      prompt: input.prompt,
    });
    const output = input.schema.parse(result.output);
    await persistAiSuggestion({
      kind: input.kind,
      ticketId: input.ticketId,
      request: input.request,
      output,
      model: result.model,
      status: "generated",
    });
    return {
      ...output,
      kind: input.kind,
      model: result.model,
      status: "generated" as const,
    };
  } catch (error) {
    const output = {
      ...input.fallback,
      error: error instanceof Error ? error.message : "AI request failed",
    };
    await persistAiSuggestion({
      kind: input.kind,
      ticketId: input.ticketId,
      request: input.request,
      output,
      model: FALLBACK_MODEL,
      status: "fallback",
    });
    return {
      ...input.fallback,
      kind: input.kind,
      model: FALLBACK_MODEL,
      status: "fallback" as const,
    };
  }
}

async function requireTicket(ticketId: string) {
  const ticket = await getTicketById(ticketId);
  if (!ticket) throw new Error(`Ticket ${ticketId} not found`);
  return ticket;
}

export async function structureIntake(input: { raw: string; language?: Lang }): Promise<AiStructuredIntakeDto> {
  const language = input.language ?? "DE";
  const fallback = structureIntakeFallback(input.raw, language);
  return runAi({
    kind: "structure_intake",
    request: input,
    system: "You structure German or English property-management maintenance intake into strict JSON. Use existing demo IDs when obvious. Do not invent passwords or auth data.",
    prompt: `Return JSON with title, category, priority, tenant, propertyId, unit, phone, email, description, contractor, confidence, access, preferred, missing.\nLanguage: ${language}\nRaw request:\n${input.raw}`,
    schema: structureIntakeSchema,
    fallback,
  });
}

export async function classifyUrgency(input: { text: string; ticketId?: string | null }): Promise<AiUrgencyDto> {
  const fallback = classifyUrgencyFallback(input.text);
  return runAi({
    kind: "classify_urgency",
    ticketId: input.ticketId,
    request: input,
    system: "You classify maintenance-ticket urgency for property management. Return strict JSON only.",
    prompt: `Return JSON with priority, confidence, reasons.\nText:\n${input.text}`,
    schema: urgencyOutputSchema,
    fallback,
  });
}

export async function generateSummary(input: { ticketId: string; language?: Lang }): Promise<AiSummaryDto> {
  const language = input.language ?? "DE";
  const ticket = await requireTicket(input.ticketId);
  const fallback = generateSummaryFallback(ticket, language);
  return runAi({
    kind: "summary",
    ticketId: ticket.id,
    request: { ticketId: input.ticketId, language },
    system: "You summarize maintenance tickets for property managers. Return strict JSON only.",
    prompt: `Return JSON with summary and confidence. Keep the summary concise and in ${language}.\nTicket:\n${JSON.stringify(ticket)}`,
    schema: summaryOutputSchema,
    fallback,
  });
}

export async function suggestContractor(input: { category: string; ticketId?: string | null }): Promise<AiContractorSuggestionDto> {
  const fallback = suggestContractorFallback(input.category);
  return runAi({
    kind: "contractor_suggestion",
    ticketId: input.ticketId,
    request: input,
    system: "You suggest one contractor for a property-management maintenance category using the demo contractor names if possible. Return strict JSON only.",
    prompt: `Return JSON with contractor, contractorId, confidence, reason.\nCategory: ${input.category}`,
    schema: contractorOutputSchema,
    fallback,
  });
}

export async function generateReplyDraft(input: { ticketId: string; language?: Lang }): Promise<AiReplyDraftDto> {
  const language = input.language ?? "DE";
  const ticket = await requireTicket(input.ticketId);
  const fallback = generateReplyDraftFallback(ticket, language);
  return runAi({
    kind: "reply_draft",
    ticketId: ticket.id,
    request: { ticketId: input.ticketId, language },
    system: "You draft tenant-facing property-management replies. Keep human approval required and do not claim the message was sent. Return strict JSON only.",
    prompt: `Return JSON with text and confidence. Draft in ${language}.\nTicket:\n${JSON.stringify(ticket)}`,
    schema: replyDraftOutputSchema,
    fallback,
  });
}

export async function detectMissingInfo(input: { ticketId: string; language?: Lang }): Promise<AiMissingInfoDto> {
  const language = input.language ?? "DE";
  const ticket = await requireTicket(input.ticketId);
  const fallback = detectMissingInfoFallback(ticket, language);
  return runAi({
    kind: "missing_info",
    ticketId: ticket.id,
    request: { ticketId: input.ticketId, language },
    system: "You identify missing tenant information required to process maintenance tickets. Return strict JSON only.",
    prompt: `Return JSON with text, items, confidence. Text should be a tenant-facing request in ${language}.\nTicket:\n${JSON.stringify(ticket)}`,
    schema: missingInfoOutputSchema,
    fallback,
  });
}

export async function translateText(input: { text: string; to: Lang; from?: Lang }): Promise<AiTranslationDto> {
  const fallback = translateTextFallback(input.text, input.to);
  return runAi({
    kind: "translation",
    request: input,
    system: "You translate property-management text between German and English. Return strict JSON only.",
    prompt: `Return JSON with text, to, confidence. Translate from ${input.from ?? "auto"} to ${input.to}.\nText:\n${input.text}`,
    schema: translationOutputSchema,
    fallback,
  });
}
