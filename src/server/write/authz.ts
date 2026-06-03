import type { Role } from "@/lib/api/types";

export function requireDemoWriteRole(action: string, role: Role | undefined, allowed: Role[]) {
  const actual = role ?? "pm";
  if (!allowed.includes(actual)) {
    throw new Error(`Demo authorization denied for ${action}: role "${actual}" is not allowed.`);
  }
  return actual;
}

export function requireTicketEventRole(type: "tenant" | "ai" | "manager" | "contractor" | "system", role: Role | undefined) {
  if (type === "tenant") return requireDemoWriteRole("add tenant ticket event", role, ["tenant", "pm"]);
  if (type === "contractor") return requireDemoWriteRole("add contractor ticket event", role, ["contractor", "pm"]);
  return requireDemoWriteRole("add management ticket event", role, ["pm"]);
}
