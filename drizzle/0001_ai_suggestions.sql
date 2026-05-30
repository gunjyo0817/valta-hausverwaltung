CREATE TABLE "ai_suggestions" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "ticket_id" text,
  "kind" text NOT NULL,
  "input" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "output" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "model" text NOT NULL,
  "status" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_suggestions" ADD CONSTRAINT "ai_suggestions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ai_suggestions" ADD CONSTRAINT "ai_suggestions_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;
