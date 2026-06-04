import { createFileRoute } from "@tanstack/react-router";
import { IntakePage } from "@/components/IntakePage";

export const Route = createFileRoute("/intake")({
  head: () => ({
    meta: [
      { title: "Report an issue · Valta" },
      { name: "description", content: "AI-guided intake for tenant maintenance requests." },
    ],
  }),
  component: IntakePage,
});