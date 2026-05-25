import { createContext, useContext, useState, type ReactNode } from "react";

export type Role = "pm" | "tenant" | "contractor" | "owner";

export const ROLE_HOME: Record<Role, string> = {
  pm: "/",
  tenant: "/tenant",
  contractor: "/contractor",
  owner: "/owner",
};

export const ROLE_META: Record<Role, { label: { DE: string; EN: string }; initials: string; person: { DE: string; EN: string }; org: { DE: string; EN: string }; color: string }> = {
  pm: {
    label: { DE: "Hausverwaltung", EN: "Property Manager" },
    initials: "SK",
    person: { DE: "Sarah Krüger", EN: "Sarah Krüger" },
    org: { DE: "Hausverwaltung Berlin GmbH", EN: "Berlin Property Mgmt." },
    color: "bg-primary/15 text-primary",
  },
  tenant: {
    label: { DE: "Mieter:in", EN: "Tenant" },
    initials: "AB",
    person: { DE: "Anna Becker", EN: "Anna Becker" },
    org: { DE: "Lindenstraße 22, WE 14", EN: "Lindenstraße 22, Unit 14" },
    color: "bg-info/15 text-info",
  },
  contractor: {
    label: { DE: "Handwerker", EN: "Contractor" },
    initials: "MH",
    person: { DE: "Thomas Müller", EN: "Thomas Müller" },
    org: { DE: "Müller Heizung GmbH", EN: "Müller Heating Ltd." },
    color: "bg-warning/20 text-warning",
  },
  owner: {
    label: { DE: "Eigentümer:in", EN: "Property Owner" },
    initials: "KR",
    person: { DE: "Dr. Karl Reichmann", EN: "Dr. Karl Reichmann" },
    org: { DE: "Reichmann Immobilien KG", EN: "Reichmann Real Estate" },
    color: "bg-ai/15 text-ai",
  },
};

const Ctx = createContext<{ role: Role; setRole: (r: Role) => void }>({
  role: "pm",
  setRole: () => {},
});

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("pm");
  return <Ctx.Provider value={{ role, setRole }}>{children}</Ctx.Provider>;
}

export const useRole = () => useContext(Ctx);
