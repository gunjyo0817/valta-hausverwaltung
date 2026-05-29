import { createFileRoute } from "@tanstack/react-router";
import { IntakePage } from "./intake";

export const Route = createFileRoute("/tenant/new-request")({
  head: () => ({
    meta: [
      { title: "New request · Valta" },
      { name: "description", content: "AI-guided intake for tenant maintenance requests." },
    ],
  }),
  component: IntakePage,
});
