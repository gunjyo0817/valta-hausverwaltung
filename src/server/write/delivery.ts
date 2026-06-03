import { desc, eq } from "drizzle-orm";

import type { LocalizedText } from "@/lib/api/types";
import { db } from "@/server/db/client";
import { ticketEvents, tickets } from "@/server/db/schema";

type DeliveryChannel = "email" | "sms" | "in_app";
type DeliveryStatus = "queued" | "sent" | "read";

export type DeliverySimulationInput = {
  ticketId: string;
  channel: DeliveryChannel;
  recipient: "tenant" | "contractor" | "pm" | "owner";
  subject: LocalizedText;
  status?: DeliveryStatus;
};

function bi(de: string, en = de): LocalizedText {
  return { DE: de, EN: en };
}

function channelLabel(channel: DeliveryChannel): LocalizedText {
  if (channel === "sms") return bi("SMS", "SMS");
  if (channel === "in_app") return bi("In-App", "In-app");
  return bi("E-Mail", "Email");
}

function recipientLabel(recipient: DeliverySimulationInput["recipient"]): LocalizedText {
  if (recipient === "tenant") return bi("Mieter:in", "tenant");
  if (recipient === "contractor") return bi("Handwerker", "contractor");
  if (recipient === "owner") return bi("Eigentuemer", "owner");
  return bi("Hausverwaltung", "property management");
}

function statusLabel(status: DeliveryStatus): LocalizedText {
  if (status === "read") return bi("gesendet und gelesen", "sent and read");
  if (status === "sent") return bi("gesendet", "sent");
  return bi("in Warteschlange", "queued");
}

async function nextSequence(ticketId: string) {
  const [latest] = await db
    .select({ sequence: ticketEvents.sequence })
    .from(ticketEvents)
    .where(eq(ticketEvents.ticketId, ticketId))
    .orderBy(desc(ticketEvents.sequence))
    .limit(1);

  return (latest?.sequence ?? 0) + 1;
}

export async function addDeliverySimulation(input: DeliverySimulationInput) {
  const [ticket] = await db.select({ id: tickets.id }).from(tickets).where(eq(tickets.id, input.ticketId)).limit(1);
  if (!ticket) return;

  const status = input.status ?? "sent";
  const channel = channelLabel(input.channel);
  const recipient = recipientLabel(input.recipient);
  const deliveryStatus = statusLabel(status);
  const sequence = await nextSequence(input.ticketId);

  await db.insert(ticketEvents).values({
    id: `${input.ticketId}-delivery-${sequence}`,
    ticketId: input.ticketId,
    type: "system",
    actorName: "Valta Delivery",
    atLabel: bi("jetzt", "now"),
    text: {
      DE: `Zustellung: ${channel.DE} an ${recipient.DE} ${deliveryStatus.DE}. ${input.subject.DE}`,
      EN: `Delivery: ${channel.EN} to ${recipient.EN} ${deliveryStatus.EN}. ${input.subject.EN}`,
    },
    sequence,
  });
}
