import type { TicketStatus, Urgency } from "@/lib/api/types";

export type TicketStatusLike = {
  status: TicketStatus;
};

export type TicketUrgencyLike = {
  urgency: Urgency;
};

export function isOpenTicketStatus(status: TicketStatus) {
  return status !== "resolved";
}

export function isResolvedTicketStatus(status: TicketStatus) {
  return status === "resolved";
}

export function isOpenTicket(ticket: TicketStatusLike) {
  return isOpenTicketStatus(ticket.status);
}

export function isResolvedTicket(ticket: TicketStatusLike) {
  return isResolvedTicketStatus(ticket.status);
}

export function isCriticalUrgency(urgency: Urgency) {
  return urgency === "critical";
}

export function isHighOrCriticalUrgency(urgency: Urgency) {
  return urgency === "high" || urgency === "critical";
}

export function isCriticalTicket(ticket: TicketUrgencyLike) {
  return isCriticalUrgency(ticket.urgency);
}

export function isHighOrCriticalTicket(ticket: TicketUrgencyLike) {
  return isHighOrCriticalUrgency(ticket.urgency);
}
