import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Sparkles,
  PenLine,
  X,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Wand2,
  CheckCircle2,
  Upload,
  Phone,
  Mail,
  Building2,
  User,
  Camera,
  KeyRound,
  Clock,
  Tag,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang, pick } from "@/lib/i18n";
import { useCreateTicket, useStructureIntake } from "@/lib/api";
import { properties } from "@/lib/properties";
import { allContractors } from "@/lib/contractors";
import { StatusBadge, UrgencyBadge, AIBadge } from "./Badges";
import type { Urgency } from "@/lib/mockData";
import { demoUploadErrorMessage, demoUploadFiles, formatDemoFileSize, type DemoUploadedFile } from "@/lib/demoUpload";

type Mode = "choose" | "ai" | "manual" | "success";

type Draft = {
  category: string;
  priority: Urgency;
  tenant: string;
  propertyId: string;
  unit: string;
  phone: string;
  email: string;
  description: string;
  contractor: string;
  confidence: number;
  access: string;
  preferred: string;
};

const CATEGORIES_DE = ["Heizung", "Sanitär", "Elektrik", "Aufzug", "Schimmel", "Fenster/Türen", "Sonstiges"];
const CATEGORIES_EN = ["Heating", "Plumbing", "Electrics", "Elevator", "Mould", "Windows/Doors", "Other"];

const SAMPLE_EMAIL_DE = `Von: anna.becker@example.de
Betreff: Heizung kalt seit gestern Abend

Hallo,
in meiner Wohnung (WE 14, 3. OG, Lindenstraße 22) ist seit gestern Abend die Heizung komplett ausgefallen. Es wird nur noch kalt – auch bei voller Reglerstellung. Bitte dringend einen Techniker schicken, ich bin werktags ab 16 Uhr zuhause.

Telefon: +49 30 1234567
Viele Grüße
Anna Becker`;

const SAMPLE_EMAIL_EN = `From: anna.becker@example.de
Subject: Heating cold since last night

Hi,
the heating in my flat (Unit 14, 3rd floor, Lindenstraße 22) has been completely off since yesterday evening. Only cold air, even at max setting. Please send a technician urgently, I'm home weekdays from 4 pm.

Phone: +49 30 1234567
Best,
Anna Becker`;

function emptyDraft(): Draft {
  return {
    category: "",
    priority: "medium",
    tenant: "",
    propertyId: "",
    unit: "",
    phone: "",
    email: "",
    description: "",
    contractor: "",
    confidence: 0,
    access: "",
    preferred: "",
  };
}

export function NewTicketModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lang } = useLang();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("choose");
  const [raw, setRaw] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [photoFiles, setPhotoFiles] = useState<DemoUploadedFile[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState("");
  const createTicketMutation = useCreateTicket();
  const structureIntakeMutation = useStructureIntake();

  useEffect(() => {
    if (!open) {
      // reset on close
      setTimeout(() => {
        setMode("choose");
        setRaw("");
        setAnalyzing(false);
        setAnalyzed(false);
        setDraft(emptyDraft());
        setPhotoFiles([]);
        setUploadError(null);
        setTicketId("");
      }, 200);
    }
  }, [open]);

  if (!open) return null;

  const T = (de: string, en: string) => pick(de, en, lang);

  const analyze = async () => {
    setAnalyzing(true);
    try {
      const result = await structureIntakeMutation.mutateAsync({
        data: {
          raw,
          language: lang,
        },
      });
      setDraft({
        category: result.category,
        priority: result.priority,
        tenant: result.tenant,
        propertyId: result.propertyId,
        unit: result.unit,
        phone: result.phone,
        email: result.email,
        description: result.description,
        contractor: result.contractor,
        confidence: result.confidence,
        access: result.access,
        preferred: result.preferred,
      });
      setAnalyzed(true);
    } finally {
      setAnalyzing(false);
    }
  };

  const createTicket = async () => {
    if (!draft.tenant || !draft.propertyId || !draft.description || createTicketMutation.isPending) return;

    const ticket = await createTicketMutation.mutateAsync({
      data: {
        category: draft.category,
        priority: draft.priority,
        tenant: draft.tenant,
        propertyId: draft.propertyId,
        unit: draft.unit,
        phone: draft.phone,
        email: draft.email,
        description: draft.description,
        contractor: draft.contractor,
        confidence: draft.confidence,
        access: draft.access,
        preferred: draft.preferred,
        photos: photoFiles.length,
        attachments: photoFiles.map((file) => ({
          name: file.name,
          type: file.type,
          url: file.url,
        })),
        language: lang,
      },
    });

    setTicketId(ticket.id);
    setMode("success");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-foreground/40 backdrop-blur-sm p-0 md:p-6 animate-in fade-in duration-150" onClick={onClose}>
      <div
        className="w-full md:max-w-2xl max-h-[92vh] overflow-hidden rounded-t-2xl md:rounded-xl bg-card border border-border shadow-elegant flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            {mode !== "choose" && mode !== "success" && (
              <button
                onClick={() => setMode("choose")}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent text-muted-foreground"
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <h2 className="text-sm font-semibold">
              {mode === "choose" && T("Neues Ticket erstellen", "Create new ticket")}
              {mode === "ai" && T("AI Intake", "AI intake")}
              {mode === "manual" && T("Manuelles Ticket", "Manual ticket")}
              {mode === "success" && T("Ticket erstellt", "Ticket created")}
            </h2>
          </div>
          <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent text-muted-foreground" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-5 flex-1">
          {mode === "choose" && <ChooseStep onPick={(m) => setMode(m)} T={T} />}
          {mode === "ai" && (
            <AiStep
              raw={raw}
              setRaw={setRaw}
              analyzing={analyzing}
              analyzed={analyzed}
              onAnalyze={analyze}
              draft={draft}
              setDraft={setDraft}
              T={T}
              loadSample={() => setRaw(lang === "DE" ? SAMPLE_EMAIL_DE : SAMPLE_EMAIL_EN)}
            />
          )}
          {mode === "manual" && <ManualStep draft={draft} setDraft={setDraft} photoFiles={photoFiles} setPhotoFiles={setPhotoFiles} uploadError={uploadError} setUploadError={setUploadError} T={T} lang={lang} />}
          {mode === "success" && <SuccessStep ticketId={ticketId} draft={draft} T={T} />}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-surface/60 flex items-center justify-between gap-2">
          {mode === "choose" && (
            <>
              <span className="text-[11px] text-muted-foreground">{T("Tipp: AI Intake spart ~3 Min. pro Ticket.", "Tip: AI intake saves ~3 min per ticket.")}</span>
              <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground px-3 py-2 rounded-md">
                {T("Abbrechen", "Cancel")}
              </button>
            </>
          )}
          {mode === "ai" && (
            <>
              <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground px-3 py-2 rounded-md">
                {T("Abbrechen", "Cancel")}
              </button>
              <button
                onClick={createTicket}
                disabled={!analyzed || createTicketMutation.isPending}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-medium transition",
                  analyzed && !createTicketMutation.isPending ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm" : "bg-muted text-muted-foreground cursor-not-allowed",
                )}
              >
                {createTicketMutation.isPending ? T("Erstelle…", "Creating…") : T("Ticket erstellen", "Create ticket")} <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          {mode === "manual" && (
            <>
              <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground px-3 py-2 rounded-md">
                {T("Abbrechen", "Cancel")}
              </button>
              <button
                onClick={createTicket}
                disabled={!draft.tenant || !draft.propertyId || !draft.description || createTicketMutation.isPending}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-medium transition",
                  draft.tenant && draft.propertyId && draft.description && !createTicketMutation.isPending
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                    : "bg-muted text-muted-foreground cursor-not-allowed",
                )}
              >
                {createTicketMutation.isPending ? T("Erstelle…", "Creating…") : T("Ticket erstellen", "Create ticket")} <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          {mode === "success" && (
            <>
              <button
                onClick={() => {
                  onClose();
                  navigate({ to: "/" });
                }}
                className="text-xs px-3.5 py-2 rounded-md border border-border hover:bg-accent"
              >
                {T("Zurück zum Dashboard", "Back to dashboard")}
              </button>
              <button
                onClick={() => {
                  onClose();
                  navigate({ to: "/ticket/$id", params: { id: ticketId } });
                }}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 shadow-sm"
              >
                {T("Ticket öffnen", "Open ticket")} <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- sub steps ---------------- */

function ChooseStep({ onPick, T }: { onPick: (m: Mode) => void; T: (de: string, en: string) => string }) {
  return (
    <div className="grid gap-3">
      <button
        onClick={() => onPick("ai")}
        className="group text-left rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-card transition relative"
      >
        <div className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-semibold text-ai bg-ai/10 px-2 py-0.5 rounded-full">
          {T("Empfohlen", "Recommended")}
        </div>
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-ai/10 text-ai inline-flex items-center justify-center">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">{T("AI Intake", "AI intake")}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {T(
                "E-Mail, WhatsApp oder Telefonnotiz einfügen – Valta erstellt ein strukturiertes Ticket.",
                "Paste an email, WhatsApp message or phone note — Valta drafts a structured ticket.",
              )}
            </p>
            <div className="flex items-center gap-1.5 mt-3 text-[11px] text-muted-foreground">
              <Wand2 className="h-3 w-3 text-ai" />
              {T("Kategorie · Priorität · Mieter · Objekt · Handwerker", "Category · priority · tenant · property · contractor")}
            </div>
          </div>
        </div>
      </button>

      <button
        onClick={() => onPick("manual")}
        className="group text-left rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-card transition"
      >
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-secondary text-foreground inline-flex items-center justify-center">
            <PenLine className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">{T("Manuelles Ticket", "Manual ticket")}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {T(
                "Alle Felder selbst ausfüllen – ideal für telefonische Meldungen mit klaren Angaben.",
                "Fill in all fields yourself — ideal for phone calls with clear details.",
              )}
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}

function AiStep({
  raw,
  setRaw,
  analyzing,
  analyzed,
  onAnalyze,
  draft,
  setDraft,
  T,
  loadSample,
}: {
  raw: string;
  setRaw: (v: string) => void;
  analyzing: boolean;
  analyzed: boolean;
  onAnalyze: () => void;
  draft: Draft;
  setDraft: (d: Draft) => void;
  T: (de: string, en: string) => string;
  loadSample: () => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-foreground">{T("Unstrukturierte Anfrage", "Unstructured request")}</label>
          <button onClick={loadSample} className="text-[11px] text-primary hover:underline">
            {T("Beispiel laden", "Load sample")}
          </button>
        </div>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={T(
            "E-Mail, WhatsApp-Nachricht oder Telefonnotiz hier einfügen…",
            "Paste email, WhatsApp message or phone note here…",
          )}
          rows={6}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring resize-none"
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={onAnalyze}
            disabled={!raw.trim() || analyzing}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition",
              !raw.trim() || analyzing ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-ai text-white hover:bg-ai/90 shadow-sm",
            )}
          >
            {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {analyzing ? T("Analysiere…", "Analyzing…") : T("Anfrage analysieren", "Analyze request")}
          </button>
        </div>
      </div>

      {analyzed && (
        <div className="rounded-xl border border-border bg-surface/60 p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-ai" />
              {T("AI-Ergebnis", "AI result")}
            </div>
            <AIBadge confidence={draft.confidence} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label={T("Kategorie", "Category")} value={draft.category} onChange={(v) => setDraft({ ...draft, category: v })} />
            <SelectField
              label={T("Priorität", "Priority")}
              value={draft.priority}
              onChange={(v) => setDraft({ ...draft, priority: v as Urgency })}
              options={[
                { v: "low", l: T("Niedrig", "Low") },
                { v: "medium", l: T("Mittel", "Medium") },
                { v: "high", l: T("Hoch", "High") },
                { v: "critical", l: T("Kritisch", "Critical") },
              ]}
            />
            <Field label={T("Mieter:in", "Tenant")} value={draft.tenant} onChange={(v) => setDraft({ ...draft, tenant: v })} />
            <SelectField
              label={T("Objekt", "Property")}
              value={draft.propertyId}
              onChange={(v) => setDraft({ ...draft, propertyId: v })}
              options={properties.map((p) => ({ v: p.id, l: p.name }))}
            />
            <Field label={T("Wohneinheit", "Unit")} value={draft.unit} onChange={(v) => setDraft({ ...draft, unit: v })} />
            <SelectField
              label={T("Vorgeschlagener Handwerker", "Suggested contractor")}
              value={draft.contractor}
              onChange={(v) => setDraft({ ...draft, contractor: v })}
              options={allContractors.map((c: { id: string; name: string }) => ({ v: c.name, l: c.name }))}
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground">{T("Beschreibung", "Description")}</label>
            <textarea
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-md border border-border bg-card px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring resize-none"
            />
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1 border-t border-border">
            <CheckCircle2 className="h-3 w-3 text-success" />
            {T("Sie können alle Felder vor dem Erstellen anpassen.", "You can edit every field before creating the ticket.")}
          </div>
        </div>
      )}
    </div>
  );
}

function ManualStep({
  draft,
  setDraft,
  photoFiles,
  setPhotoFiles,
  uploadError,
  setUploadError,
  T,
  lang,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  photoFiles: DemoUploadedFile[];
  setPhotoFiles: (files: DemoUploadedFile[]) => void;
  uploadError: string | null;
  setUploadError: (error: string | null) => void;
  T: (de: string, en: string) => string;
  lang: "DE" | "EN";
}) {
  const addPhotoFiles = async (files: FileList | null) => {
    setUploadError(null);
    try {
      const uploaded = await demoUploadFiles(files, { kind: "image", maxFiles: 5 });
      setPhotoFiles(uploaded);
    } catch (error) {
      setUploadError(demoUploadErrorMessage(error, lang));
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SelectField
          label={T("Objekt", "Property")}
          icon={Building2}
          value={draft.propertyId}
          onChange={(v) => setDraft({ ...draft, propertyId: v })}
          options={[{ v: "", l: T("— wählen —", "— select —") }, ...properties.map((p) => ({ v: p.id, l: p.name }))]}
        />
        <Field label={T("Wohneinheit", "Unit")} value={draft.unit} onChange={(v) => setDraft({ ...draft, unit: v })} placeholder={T("z. B. WE 14, 3. OG", "e.g. Unit 14, 3rd floor")} />
        <Field label={T("Name der Mieter:in", "Tenant name")} icon={User} value={draft.tenant} onChange={(v) => setDraft({ ...draft, tenant: v })} />
        <Field label={T("Telefon", "Phone")} icon={Phone} value={draft.phone} onChange={(v) => setDraft({ ...draft, phone: v })} placeholder="+49 …" />
        <Field label={T("E-Mail", "Email")} icon={Mail} value={draft.email} onChange={(v) => setDraft({ ...draft, email: v })} placeholder="name@example.com" />
        <SelectField
          label={T("Kategorie", "Category")}
          icon={Tag}
          value={draft.category}
          onChange={(v) => setDraft({ ...draft, category: v })}
          options={[{ v: "", l: T("— wählen —", "— select —") }, ...(T("DE", "EN") === "EN" ? CATEGORIES_EN : CATEGORIES_DE).map((c) => ({ v: c, l: c }))]}
        />
        <SelectField
          label={T("Priorität", "Priority")}
          icon={AlertTriangle}
          value={draft.priority}
          onChange={(v) => setDraft({ ...draft, priority: v as Urgency })}
          options={[
            { v: "low", l: T("Niedrig", "Low") },
            { v: "medium", l: T("Mittel", "Medium") },
            { v: "high", l: T("Hoch", "High") },
            { v: "critical", l: T("Kritisch", "Critical") },
          ]}
        />
        <Field label={T("Bevorzugter Termin", "Preferred appointment")} icon={Clock} value={draft.preferred} onChange={(v) => setDraft({ ...draft, preferred: v })} placeholder={T("z. B. Mo–Fr 16–19 Uhr", "e.g. Mon–Fri 4–7 pm")} />
      </div>

      <div>
        <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1"><FileText className="h-3 w-3" /> {T("Beschreibung", "Description")}</label>
        <textarea
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          rows={3}
          placeholder={T("Was ist passiert? Bitte so konkret wie möglich.", "What happened? Please be as specific as possible.")}
          className="mt-1 w-full rounded-md border border-border bg-card px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring resize-none"
        />
      </div>

      <Field label={T("Zugangsinformationen", "Access information")} icon={KeyRound} value={draft.access} onChange={(v) => setDraft({ ...draft, access: v })} placeholder={T("z. B. Schlüssel beim Nachbarn WE 12", "e.g. key with neighbour Unit 12")} />

      <div>
        <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1"><Camera className="h-3 w-3" /> {T("Fotos", "Photos")}</label>
        {uploadError && <div className="mt-1 rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-2 text-xs text-destructive">{uploadError}</div>}
        <label className="mt-1 border border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center text-center bg-surface/40 hover:bg-surface transition cursor-pointer">
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => void addPhotoFiles(event.target.files)}
          />
          <Upload className="h-4 w-4 text-muted-foreground mb-1.5" />
          <span className="text-xs text-muted-foreground">
            {photoFiles.length > 0 ? `${photoFiles.length} ${T("Foto(s) ausgewählt", "photo(s) selected")}` : T("Fotos hierher ziehen oder klicken zum Auswählen", "Drag photos here or click to select")}
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5">PNG · JPG · HEIC · {T("max. 5 MB", "max. 5 MB")}</span>
        </label>
        {photoFiles.length > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {photoFiles.map((file) => (
              <div key={file.name} className="flex items-center gap-2 rounded-md border border-border bg-card p-2 text-xs">
                <img src={file.url} alt={file.name} className="h-10 w-10 rounded object-cover" />
                <div className="min-w-0">
                  <div className="truncate font-medium">{file.name}</div>
                  <div className="text-[10px] text-muted-foreground">{formatDemoFileSize(file.size)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SuccessStep({ ticketId, draft, T }: { ticketId: string; draft: Draft; T: (de: string, en: string) => string }) {
  const property = properties.find((p) => p.id === draft.propertyId);
  const nextSteps = [
    T("Handwerker-Anfrage an " + (draft.contractor || "vorgeschlagenen Partner") + " senden", "Send job request to " + (draft.contractor || "suggested partner")),
    T("Mieter:in über voraussichtlichen Termin informieren", "Notify tenant about expected appointment"),
    T("SLA-Timer aktivieren · Eskalation bei > 4 Std.", "Activate SLA timer · escalate after > 4 h"),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center text-center py-2">
        <div className="h-12 w-12 rounded-full bg-success/15 text-success inline-flex items-center justify-center mb-2">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="text-sm font-semibold">{T("Ticket erfolgreich erstellt", "Ticket created successfully")}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{T("Strukturierte Anfrage steht in der Operations Inbox bereit.", "Structured request is queued in the operations inbox.")}</div>
      </div>

      <div className="rounded-xl border border-border bg-surface/60 p-4 grid grid-cols-2 gap-3 text-xs">
        <Meta label={T("Ticket-ID", "Ticket ID")} value={<span className="font-mono">{ticketId}</span>} />
        <Meta label={T("Status", "Status")} value={<StatusBadge status="new" />} />
        <Meta label={T("Priorität", "Priority")} value={<UrgencyBadge urgency={draft.priority} />} />
        <Meta label={T("Mieter:in", "Tenant")} value={draft.tenant || "—"} />
        <Meta label={T("Objekt", "Property")} value={property?.name || draft.propertyId || "—"} />
        <Meta label={T("Handwerker", "Contractor")} value={draft.contractor || "—"} />
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-xs font-semibold mb-2">
          <Sparkles className="h-3.5 w-3.5 text-ai" /> {T("AI-Vorschläge: nächste Schritte", "AI suggested next steps")}
        </div>
        <ul className="space-y-1.5">
          {nextSteps.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-xs">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-ai shrink-0" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ---------------- atoms ---------------- */

function Field({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: any;
}) {
  return (
    <div>
      <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-border bg-card px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
  icon?: any;
}) {
  return (
    <div>
      <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-border bg-card px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </select>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-foreground font-medium">{value}</div>
    </div>
  );
}
