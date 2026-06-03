import {
  clearDemoData,
  getDemoDataStatus,
  reloadDemoData,
  type DemoDataStatus,
} from "../src/server/demoData";

type Action = "status" | "clear" | "reload";

function isAction(value: string | undefined): value is Action {
  return value === "status" || value === "clear" || value === "reload";
}

function printStatus(status: DemoDataStatus) {
  console.log(`Demo controls: ${status.enabled ? "enabled" : "disabled"}`);
  if (status.reason) console.log(`Reason: ${status.reason}`);
  console.log(`Checked at: ${status.checkedAt}`);
  console.log("");
  console.log("Preserved identity rows:");
  console.log(`  organizations: ${status.counts.organizations}`);
  console.log(`  users: ${status.counts.users}`);
  console.log(`  userRoles: ${status.counts.userRoles}`);
  console.log(`  total: ${status.identityTotal}`);
  console.log("");
  console.log("Mutable demo rows:");
  for (const table of [
    "properties",
    "units",
    "tenants",
    "contractors",
    "tickets",
    "ticketEvents",
    "ticketAssignments",
    "documents",
    "notifications",
    "aiActivities",
    "aiSuggestions",
    "approvals",
    "invoices",
  ] as const) {
    console.log(`  ${table}: ${status.counts[table]}`);
  }
  console.log(`  total: ${status.mutableTotal}`);
}

async function main() {
  const action = process.argv[2];

  if (!isAction(action)) {
    console.error("Usage: npm run db:demo:status | db:demo:clear | db:demo:reload");
    console.error("Direct: tsx scripts/demo-data.ts <status|clear|reload>");
    process.exitCode = 1;
    return;
  }

  if (action === "status") {
    printStatus(await getDemoDataStatus());
    return;
  }

  if (action === "clear") {
    const result = await clearDemoData();
    console.log("Cleared mutable demo data.");
    console.log(`Before mutable rows: ${result.before.mutableTotal}`);
    console.log(`After mutable rows: ${result.after.mutableTotal}`);
    console.log(`Identity rows preserved: ${result.after.identityTotal}`);
    return;
  }

  const result = await reloadDemoData();
  console.log("Reloaded mock demo data.");
  console.log(`Before mutable rows: ${result.before.mutableTotal}`);
  console.log(`After mutable rows: ${result.after.mutableTotal}`);
  console.log(`Identity rows present: ${result.after.identityTotal}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
