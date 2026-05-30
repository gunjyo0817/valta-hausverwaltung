import { eq, sql } from "drizzle-orm";

import type { ApprovalStatus, LocalizedText, Role } from "@/lib/api/types";
import { db } from "@/server/db/client";
import { aiActivities, approvals, notifications } from "@/server/db/schema";
import { listApprovals } from "@/server/read/queries";

export type UpdateApprovalDecisionInput = {
  id: string;
  status: Exclude<ApprovalStatus, "pending">;
  role?: Role;
};

function bi(de: string, en = de): LocalizedText {
  return { DE: de, EN: en };
}

function statusText(status: UpdateApprovalDecisionInput["status"]) {
  if (status === "approved") return bi("freigegeben", "approved");
  if (status === "rejected") return bi("abgelehnt", "rejected");
  return bi("mit Rückfrage markiert", "marked for clarification");
}

async function nextActivitySequence() {
  const [latest] = await db
    .select({ sequence: aiActivities.sequence })
    .from(aiActivities)
    .orderBy(sql`${aiActivities.sequence} desc`)
    .limit(1);

  return (latest?.sequence ?? 0) + 1;
}

export async function updateApprovalDecision(input: UpdateApprovalDecisionInput) {
  const [approval] = await db.select().from(approvals).where(eq(approvals.id, input.id)).limit(1);
  if (!approval) throw new Error(`Approval not found: ${input.id}`);

  await db
    .update(approvals)
    .set({
      status: input.status,
      updatedAt: new Date(),
    })
    .where(eq(approvals.id, input.id));

  const decision = statusText(input.status);
  await db.insert(notifications).values({
    id: `${approval.id}-owner-decision-${input.status}-${Date.now()}`,
    recipientUserId: "demo-pm",
    type: input.status === "clarification_requested" ? "missing" : "approval",
    title: bi("Eigentümerentscheidung erhalten", "Owner decision received"),
    description: bi(
      `${approval.id} wurde ${decision.DE}.`,
      `${approval.id} was ${decision.EN}.`,
    ),
    ticketId: approval.id,
    context: approval.amountLabel,
    timeLabel: bi("jetzt", "now"),
    unread: true,
    targetPath: "/owner/approvals",
    targetParams: null,
    action: bi("Freigaben ansehen", "View approvals"),
  });

  const sequence = await nextActivitySequence();
  await db.insert(aiActivities).values({
    id: `${approval.id}-owner-decision-activity-${Date.now()}`,
    organizationId: approval.organizationId,
    atLabel: bi("jetzt", "now"),
    text: bi(
      `Eigentümerentscheidung: ${approval.id} ${decision.DE}.`,
      `Owner decision: ${approval.id} ${decision.EN}.`,
    ),
    sequence,
  });

  return listApprovals({ role: input.role ?? "owner" });
}
