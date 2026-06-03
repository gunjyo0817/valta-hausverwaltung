import assert from "node:assert/strict";

import { classifyUrgency } from "../src/server/ai/service";
import { getDemoDataStatus, reloadDemoData } from "../src/server/demoData";
import { listNotifications, listTickets } from "../src/server/read/queries";
import { assignContractor } from "../src/server/write/assignments";
import { updateApprovalDecision } from "../src/server/write/approvals";
import { updateContractorJob } from "../src/server/write/contractorActions";
import { createTicket } from "../src/server/write/tickets";

async function expectRejected(label: string, fn: () => Promise<unknown>) {
  let rejected = false;
  try {
    await fn();
  } catch (error) {
    rejected = true;
    assert.match(error instanceof Error ? error.message : String(error), /authorization denied/i, label);
  }
  assert.equal(rejected, true, label);
}

async function main() {
  const before = await getDemoDataStatus();
  if (!before.enabled) {
    console.log(`Skipped demo regression: ${before.reason ?? "demo admin is disabled"}`);
    return;
  }

  await reloadDemoData();
  const status = await getDemoDataStatus();
  assert.ok(status.counts.tickets > 0, "reload should seed tickets");
  assert.ok(status.counts.properties > 0, "reload should seed properties");
  assert.ok(status.counts.contractors > 0, "reload should seed contractors");

  await expectRejected("tenant cannot assign contractor", () =>
    assignContractor({ ticketId: "VLT-2049", contractorId: "c1", role: "tenant" }),
  );
  await expectRejected("pm cannot perform contractor job action", () =>
    updateContractorJob({ ticketId: "VLT-2049", action: "start", role: "pm" }),
  );
  await expectRejected("pm cannot decide owner approval", () =>
    updateApprovalDecision({ id: "AP-104", status: "approved", role: "pm" }),
  );

  const created = await createTicket({
    role: "tenant",
    tenant: "Anna Becker",
    propertyId: "p-lindenstr-22",
    priority: "medium",
    description: "Regression test issue in the kitchen sink.",
    category: "Plumbing",
    language: "EN",
  });
  assert.ok(created.id.startsWith("VLT-"), "ticket creation should return a ticket id");

  const tenantTickets = await listTickets({ role: "tenant" });
  assert.ok(tenantTickets.some((ticket) => ticket.id === created.id), "tenant scope should include the ticket created by the demo tenant");
  assert.ok(tenantTickets.every((ticket) => ticket.tenant.name === "Anna Becker"), "tenant scope should not expose unrelated tenant names");

  const urgency = await classifyUrgency({ text: "The heating is fully broken and water is leaking.", language: "EN", regenerate: true });
  assert.ok(["low", "medium", "high", "critical"].includes(urgency.priority), "AI fallback/classification should return a valid urgency");

  const pmNotifications = await listNotifications({ role: "pm" });
  assert.ok(Array.isArray(pmNotifications), "notifications should be readable for PM role");

  console.log("Demo regression checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
