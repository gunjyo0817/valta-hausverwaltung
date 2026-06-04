import { createContext, useContext, useState, type ReactNode } from "react";

export type Lang = "DE" | "EN";

const dict = {
  // Brand / shell
  "brand.tagline": { DE: "Operations Copilot", EN: "Operations Copilot" },
  "shell.copilot_blurb": {
    DE: "Strukturiert Anfragen, priorisiert Dringlichkeit und schlägt Handwerker vor.",
    EN: "Structures requests, prioritises urgency, recommends contractors.",
  },
  "shell.org": { DE: "Hausverwaltung Berlin GmbH", EN: "Berlin Property Management Ltd." },

  // Nav
  "nav.dashboard": { DE: "Dashboard", EN: "Dashboard" },
  "nav.inbox": { DE: "Operations Inbox", EN: "Operations Inbox" },
  "nav.insights": { DE: "AI Insights", EN: "AI Insights" },
  "nav.properties": { DE: "Objekte", EN: "Properties" },
  "nav.contractors": { DE: "Handwerker", EN: "Contractors" },
  "nav.tenant_view": { DE: "Mieter-Sicht (Demo)", EN: "Tenant view (demo)" },
  "nav.intake": { DE: "Schaden melden", EN: "Report an issue" },
  "nav.portal": { DE: "Mieter Portal", EN: "Tenant Portal" },
  "nav.section_hv": { DE: "Hausverwaltung", EN: "Property management" },

  // Dashboard
  "dash.greeting": { DE: "Guten Morgen, Sarah", EN: "Good morning, Sarah" },
  "dash.sub": {
    DE: "Hier ist, was in Ihrem Portfolio heute Aufmerksamkeit braucht.",
    EN: "Here's what needs your attention across the portfolio today.",
  },
  "kpi.open": { DE: "Offene Tickets", EN: "Open tickets" },
  "kpi.open.delta": { DE: "+3 heute", EN: "+3 today" },
  "kpi.response": { DE: "Ø Reaktionszeit", EN: "Avg. response time" },
  "kpi.response.delta": { DE: "−38% MoM", EN: "−38% MoM" },
  "kpi.ai": { DE: "AI-Vorschläge übernommen", EN: "AI suggestions accepted" },
  "kpi.ai.delta": { DE: "diese Woche", EN: "this week" },
  "kpi.urgent": { DE: "Akute Fälle", EN: "Urgent cases" },
  "kpi.urgent.delta": { DE: "Hoch oder kritisch", EN: "High or critical" },
  "kpi.pending": { DE: "Wartet auf Handwerker", EN: "Awaiting contractor" },
  "kpi.pending.delta": { DE: "2 überfällig", EN: "2 overdue" },
  "section.active": { DE: "Aktive Tickets", EN: "Active tickets" },
  "section.active.sub": {
    DE: "Sortiert nach Dringlichkeit – Copilot triagiert in Echtzeit.",
    EN: "Sorted by urgency — Copilot triages in real time.",
  },
  "section.open_inbox": { DE: "Inbox öffnen", EN: "Open inbox" },
  "section.ai_activity": { DE: "AI Assistant · Aktivität", EN: "AI Assistant · activity" },
  "section.notifications": { DE: "Benachrichtigungen", EN: "Notifications" },

  // Actions
  "act.new_ticket": { DE: "Neues Ticket", EN: "New ticket" },
  "act.approve": { DE: "Freigeben & senden", EN: "Approve & send" },
  "act.sent": { DE: "Gesendet", EN: "Sent" },
  "act.edit": { DE: "Bearbeiten", EN: "Edit" },
  "act.done": { DE: "Fertig", EN: "Done" },
  "act.manual": { DE: "Manuell senden", EN: "Send manually" },
  "act.assign": { DE: "Handwerker zuweisen", EN: "Assign contractor" },
  "act.request_info": { DE: "Mehr Infos anfordern", EN: "Request more info" },
  "act.request_quote": { DE: "Angebot anfordern", EN: "Request quote" },
  "act.send_summary": { DE: "Zusammenfassung senden", EN: "Send summary" },
  "act.back": { DE: "Zurück", EN: "Back" },
  "act.back_to_inbox": { DE: "Zurück zur Inbox", EN: "Back to inbox" },
  "act.back_to_properties": { DE: "Zurück zu Objekten", EN: "Back to properties" },
  "act.back_to_contractors": { DE: "Zurück zu Handwerkern", EN: "Back to contractors" },
  "act.view_all": { DE: "Alle anzeigen", EN: "View all" },
  "act.contact": { DE: "Kontaktieren", EN: "Contact" },
  "act.call": { DE: "Anrufen", EN: "Call" },
  "act.email": { DE: "E-Mail", EN: "Email" },
  "act.open_ticket": { DE: "Ticket öffnen", EN: "Open ticket" },

  // Common
  "common.search": { DE: "Tickets, Mieter:innen, Objekte, Handwerker suchen…", EN: "Search tickets, tenants, properties, contractors…" },
  "common.search_tickets": { DE: "Tickets durchsuchen…", EN: "Search tickets…" },
  "common.search_properties": { DE: "Objekte durchsuchen…", EN: "Search properties…" },
  "common.search_contractors": { DE: "Handwerker durchsuchen…", EN: "Search contractors…" },
  "common.tenant": { DE: "Mieter:in", EN: "Tenant" },
  "common.tenants": { DE: "Mieter:innen", EN: "Tenants" },
  "common.manager": { DE: "Verwalter:in", EN: "Property manager" },
  "common.ai": { DE: "AI", EN: "AI" },
  "common.contractor": { DE: "Handwerker", EN: "Contractor" },
  "common.contractors": { DE: "Handwerker", EN: "Contractors" },
  "common.properties": { DE: "Objekte", EN: "Properties" },
  "common.property": { DE: "Objekt", EN: "Property" },
  "common.units": { DE: "Wohneinheiten", EN: "Units" },
  "common.open_tickets": { DE: "Offene Tickets", EN: "Open tickets" },
  "common.critical": { DE: "Kritisch", EN: "Critical" },
  "common.timeline": { DE: "Kommunikationsverlauf", EN: "Communication timeline" },
  "common.timeline_sub": { DE: "E-Mail, SMS, App, Telefon – vereint in einem operativen Thread.", EN: "Email, SMS, app, phone — unified into one operational thread." },
  "common.summary": { DE: "AI-Zusammenfassung", EN: "AI summary" },
  "common.show_original": { DE: "Original (DE)", EN: "Original (DE)" },
  "common.show_en": { DE: "Auf Englisch anzeigen", EN: "Translated" },
  "common.category": { DE: "Kategorie", EN: "Category" },
  "common.priority": { DE: "Priorität", EN: "Priority" },
  "common.status": { DE: "Status", EN: "Status" },
  "common.since": { DE: "Seit", EN: "Since" },
  "common.language": { DE: "Sprache", EN: "Language" },
  "common.photos": { DE: "Fotos", EN: "Photos" },
  "common.attached_photos": { DE: "Angehängte Fotos", EN: "Attached photos" },
  "common.address": { DE: "Adresse", EN: "Address" },
  "common.city": { DE: "Stadt", EN: "City" },
  "common.rating": { DE: "Bewertung", EN: "Rating" },
  "common.eta": { DE: "ETA", EN: "ETA" },
  "common.available": { DE: "Verfügbar", EN: "Available" },
  "common.unavailable": { DE: "Nicht verfügbar", EN: "Unavailable" },
  "common.preferred": { DE: "Bevorzugter Partner", EN: "Preferred vendor" },
  "common.specialty": { DE: "Spezialisierung", EN: "Specialty" },
  "common.service_area": { DE: "Einsatzgebiet", EN: "Service area" },
  "common.active_jobs": { DE: "Aktive Aufträge", EN: "Active jobs" },
  "common.past_jobs": { DE: "Erledigte Aufträge", EN: "Completed jobs" },
  "common.avg_completion": { DE: "Ø Bearbeitungszeit", EN: "Avg. completion" },
  "common.reliability": { DE: "Zuverlässigkeit", EN: "Reliability" },
  "common.documents": { DE: "Dokumente", EN: "Documents" },
  "common.overview": { DE: "Übersicht", EN: "Overview" },
  "common.communication": { DE: "Kommunikation", EN: "Communication" },
  "common.assigned_manager": { DE: "Zuständige:r Verwalter:in", EN: "Assigned manager" },
  "common.maintenance_status": { DE: "Wartungs-Status", EN: "Maintenance status" },
  "common.healthy": { DE: "Stabil", EN: "Healthy" },
  "common.attention": { DE: "Beobachten", EN: "Attention" },
  "common.urgent": { DE: "Dringend", EN: "Urgent" },
  "common.hours_short": { DE: "Std.", EN: "h" },
  "common.minutes_short": { DE: "Min.", EN: "min" },
  "common.no_results": { DE: "Keine Treffer", EN: "No results" },
  "common.empty_sub": { DE: "Passen Sie Suche oder Filter an.", EN: "Adjust your search or filters." },
  "common.loading": { DE: "Lädt…", EN: "Loading…" },
  "common.all": { DE: "Alle", EN: "All" },
  "common.filter": { DE: "Filter", EN: "Filter" },
  "common.more": { DE: "Mehr", EN: "More" },
  "common.now": { DE: "jetzt", EN: "now" },
  "common.ai_summary_property": { DE: "AI-Zusammenfassung Objekt", EN: "AI property summary" },
  "common.ai_recommendation": { DE: "AI-Empfehlung", EN: "AI recommendation" },

  // Statuses
  "status.new": { DE: "Neu", EN: "New" },
  "status.waiting": { DE: "Wartet auf Info", EN: "Waiting on info" },
  "status.in_progress": { DE: "In Bearbeitung", EN: "In progress" },
  "status.contractor_assigned": { DE: "Handwerker vergeben", EN: "Contractor assigned" },
  "status.resolved": { DE: "Erledigt", EN: "Resolved" },

  // Urgency
  "urgency.low": { DE: "Niedrig", EN: "Low" },
  "urgency.medium": { DE: "Mittel", EN: "Medium" },
  "urgency.high": { DE: "Hoch", EN: "High" },
  "urgency.critical": { DE: "Kritisch", EN: "Critical" },

  // Inbox filters
  "filter.all": { DE: "Alle", EN: "All" },
  "filter.critical": { DE: "Hoch/Kritisch", EN: "High/Critical" },
  "filter.new": { DE: "Neu", EN: "New" },
  "filter.waiting": { DE: "Wartet auf Info", EN: "Waiting" },
  "filter.in_progress": { DE: "In Bearbeitung", EN: "In progress" },

  // Inbox
  "inbox.title": { DE: "Operations Inbox", EN: "Operations Inbox" },
  "inbox.sub": { DE: "AI triagiert · Mensch entscheidet", EN: "AI triages · humans decide" },
  "inbox.recommended": { DE: "Empfohlener Handwerker", EN: "Recommended contractor" },
  "inbox.recommended_basis": { DE: "Auf Basis Kategorie & Historie", EN: "Based on category & history" },

  // Copilot
  "copilot.title": { DE: "AI Copilot", EN: "AI Copilot" },
  "copilot.subtitle": { DE: "Vorschläge – Sie behalten die Kontrolle.", EN: "Suggestions — you stay in control." },
  "copilot.suggests_approve": { DE: "Schlägt vor — Sie entscheiden", EN: "Suggests — you approve" },
  "copilot.reply_draft": { DE: "Antwortentwurf", EN: "Reply draft" },
  "copilot.missing_info": { DE: "Fehlende Informationen erkannt", EN: "Missing information detected" },
  "copilot.why_critical": { DE: "Begründung Dringlichkeit", EN: "Why critical?" },
  "copilot.auto_sent": { DE: "Auto-Nachricht an Mieter:in gesendet – AI fragt nach.", EN: "Auto-message sent to tenant — AI will follow up." },

  // Ticket
  "ticket.all_channels": { DE: "Alle Kanäle zentralisiert", EN: "All channels consolidated" },
  "ticket.draft_approved": { DE: "AI-Entwurf freigegeben", EN: "AI draft approved" },

  // Insights
  "ins.title": { DE: "AI Insights", EN: "AI Insights" },
  "ins.sub": { DE: "Operativer Intelligence-Layer · letzte 90 Tage", EN: "Operational intelligence layer · last 90 days" },
  "ins.automation": { DE: "AI-Automatisierungsrate", EN: "AI automation rate" },
  "ins.automation.delta": { DE: "+12% MoM", EN: "+12% MoM" },
  "ins.resolution": { DE: "Ø Auflösungszeit", EN: "Avg. resolution time" },
  "ins.resolution.delta": { DE: "−9 Std. seit Einführung", EN: "−9 h since launch" },
  "ins.sla": { DE: "SLA-Verletzungen", EN: "SLA breaches" },
  "ins.sla.delta": { DE: "diese Woche", EN: "this week" },
  "ins.hotspot": { DE: "Kritischer Hotspot", EN: "Critical hotspot" },
  "ins.hotspot.delta": { DE: "34% aller Anfragen", EN: "34% of all requests" },
  "ins.response_per_week": { DE: "Reaktionszeit pro Woche", EN: "Response time per week" },
  "ins.response_sub": { DE: "Minuten zwischen Eingang und erster Antwort.", EN: "Minutes between intake and first response." },
  "ins.trend_q1": { DE: "−64% seit Q1", EN: "−64% since Q1" },
  "ins.categories": { DE: "Häufigste Kategorien", EN: "Top categories" },
  "ins.categories_sub": { DE: "Anteil der Tickets pro Kategorie.", EN: "Share of tickets per category." },
  "ins.atrisk": { DE: "Risiko-Tickets · brauchen Aufmerksamkeit", EN: "At-risk tickets · need attention" },
  "ins.atrisk_sub": { DE: "AI-erkannte Eskalations-Kandidaten.", EN: "AI-identified escalation candidates." },
  "ins.atrisk_open": { DE: "Std. offen", EN: "h open" },
  "ins.atrisk_handle": { DE: "Bearbeiten", EN: "Handle" },
  "ins.ai_panel": { DE: "AI-Automatisierung", EN: "AI automation" },
  "ins.ai_panel_sub": { DE: "der AI-Entwürfe wurden ohne Bearbeitung freigegeben.", EN: "of AI drafts approved without edits." },
  "ins.auto_triage": { DE: "Auto-Triage", EN: "Auto triage" },
  "ins.contractor_accepted": { DE: "Handwerker-Vorschlag akzeptiert", EN: "Contractor suggestion accepted" },
  "ins.translations": { DE: "Übersetzungen", EN: "Translations" },
  "ins.duplicates": { DE: "Duplikate erkannt", EN: "Duplicates detected" },
  "ins.top_performer": { DE: "Handwerker-Netzwerk · Top-Performer", EN: "Contractor network · top performers" },
  "ins.top_performer_sub": { DE: "Nach Reaktionszeit und Mieter-Zufriedenheit.", EN: "By response time and tenant satisfaction." },
  "ins.demo_note": { DE: "Demo-Daten · {n} aktive Tickets im Bestand", EN: "Demo data · {n} active tickets in the portfolio" },

  // Properties
  "prop.title": { DE: "Objekte", EN: "Properties" },
  "prop.sub": { DE: "Ihr Portfolio im Überblick · {n} Objekte", EN: "Your portfolio at a glance · {n} properties" },
  "prop.units": { DE: "Einheiten", EN: "Units" },
  "prop.manager": { DE: "Verwalter:in", EN: "Manager" },
  "prop.avg_response": { DE: "Ø Reaktion", EN: "Avg. response" },
  "prop.filter_status": { DE: "Status", EN: "Status" },
  "prop.filter_city": { DE: "Stadt", EN: "City" },
  "prop.recent_communication": { DE: "Aktuelle Kommunikation", EN: "Recent communication" },
  "prop.documents_sub": { DE: "Verträge, Pläne, Protokolle.", EN: "Contracts, floor plans, minutes." },

  // Contractors
  "ctr.title": { DE: "Handwerker", EN: "Contractors" },
  "ctr.sub": { DE: "Ihr Partner-Netzwerk · {n} Firmen", EN: "Your partner network · {n} companies" },
  "ctr.filter_specialty": { DE: "Gewerk", EN: "Specialty" },
  "ctr.filter_availability": { DE: "Verfügbarkeit", EN: "Availability" },
  "ctr.contact_info": { DE: "Kontaktdaten", EN: "Contact information" },
  "ctr.ai_explain": {
    DE: "Valta priorisiert diesen Partner basierend auf Reaktionszeit, Bewertung und früheren Aufträgen in dieser Region.",
    EN: "Valta prioritises this partner based on response time, rating and prior jobs in this region.",
  },

  // Intake (tenant)
  "intake.brand": { DE: "Valta · Schaden melden", EN: "Valta · Report an issue" },
  "intake.greeting": {
    DE: "Hallo 👋 Ich bin Valta, der digitale Assistent Ihrer Hausverwaltung. Was möchten Sie melden?",
    EN: "Hi 👋 I'm Valta, your property management's digital assistant. What would you like to report?",
  },
  "intake.placeholder": { DE: "Beschreiben Sie das Problem…", EN: "Describe the problem…" },
  "intake.send": { DE: "Senden", EN: "Send" },
  "intake.privacy": {
    DE: "Ihre Angaben werden direkt an die Hausverwaltung übermittelt. Keine Daten verlassen das Verwaltungssystem.",
    EN: "Your input is sent directly to property management. Data stays inside the system.",
  },
  "intake.unit": { DE: "Wohneinheit", EN: "Unit" },
  "intake.change_unit": { DE: "Wohnung wechseln", EN: "Change unit" },
  "intake.what_happens": { DE: "Was passiert mit Ihrer Meldung?", EN: "What happens with your report?" },
  "intake.step1": { DE: "Valta stellt fehlende Rückfragen.", EN: "Valta asks any missing follow-up questions." },
  "intake.step2": { DE: "Ein strukturiertes Ticket wird erstellt.", EN: "A structured ticket is created." },
  "intake.step3": { DE: "Hausverwaltung beauftragt Handwerker.", EN: "Property management dispatches a contractor." },
  "intake.step4": { DE: "Sie erhalten Status-Updates.", EN: "You receive status updates." },
  "intake.tips": { DE: "Tipps für schnelle Bearbeitung", EN: "Tips for fast handling" },
  "intake.tip1": { DE: "Fotos beschleunigen die Diagnose.", EN: "Photos speed up diagnosis." },
  "intake.tip2": { DE: "Geben Sie an, ob es akut ist.", EN: "Tell us if it's urgent." },
  "intake.tip3": { DE: "Nennen Sie den genauen Ort.", EN: "Specify the exact location." },
  "intake.track": { DE: "Status verfolgen →", EN: "Track status →" },
  "intake.thanks_structuring": {
    DE: "Vielen Dank. Ich strukturiere Ihre Angaben jetzt zu einem operativen Ticket…",
    EN: "Thank you. I'm structuring your input into an operational ticket…",
  },
  "intake.photo_attached": { DE: "📎 Foto angehängt", EN: "📎 Photo attached" },
  "intake.structuring": { DE: "AI strukturiert Ihre Meldung…", EN: "AI is structuring your report…" },
  "intake.structured_ticket": { DE: "AI-strukturiertes Reparatur-Ticket", EN: "AI-structured repair ticket" },
  "intake.submitted": { DE: "Eingereicht", EN: "Submitted" },
  "intake.further": { DE: "Weiteres Anliegen melden", EN: "Report another issue" },

  // Portal
  "portal.title": { DE: "Mein Anliegen", EN: "My request" },
  "portal.subtitle": { DE: "Wir kümmern uns – ein Techniker ist auf dem Weg.", EN: "We're on it — a technician is on the way." },
  "portal.case": { DE: "Vorgang", EN: "Case" },
  "portal.in_progress": { DE: "In Bearbeitung", EN: "In progress" },
  "portal.assigned_contractor": { DE: "Beauftragter Handwerker", EN: "Assigned contractor" },
  "portal.progress": { DE: "Fortschritt", EN: "Progress" },
  "portal.updates": { DE: "Updates", EN: "Updates" },
  "portal.attachments": { DE: "Ihre Anhänge", EN: "Your attachments" },
  "portal.add_photo": { DE: "+ Foto", EN: "+ Photo" },
  "portal.contact_pm": { DE: "Hausverwaltung kontaktieren", EN: "Contact property management" },
  "portal.notifications": { DE: "Benachrichtigungen verwalten", EN: "Manage notifications" },

  // Role switcher
  "role.current_view": { DE: "Aktuelle Sicht", EN: "Current view" },
  "role.switch": { DE: "Rolle wechseln", EN: "Switch role" },
  "role.demo_mode": { DE: "Demo-Modus · Rolle umschalten", EN: "Demo mode · switch role" },
  "role.pm": { DE: "Hausverwaltung", EN: "Property Manager" },
  "role.tenant": { DE: "Mieter:in", EN: "Tenant" },
  "role.contractor": { DE: "Handwerker", EN: "Contractor" },
  "role.owner": { DE: "Eigentümer:in", EN: "Property Owner" },
  "role.pm_view": { DE: "Hausverwaltungs-Sicht", EN: "Property Manager view" },
  "role.tenant_view": { DE: "Mieter-Sicht", EN: "Tenant view" },
  "role.contractor_view": { DE: "Handwerker-Sicht", EN: "Contractor view" },
  "role.owner_view": { DE: "Eigentümer-Sicht", EN: "Owner view" },

  // Tenant role nav
  "tnav.report": { DE: "Schaden melden", EN: "Report issue" },
  "tnav.requests": { DE: "Meine Anfragen", EN: "My requests" },
  "tnav.messages": { DE: "Nachrichten", EN: "Messages" },
  "tnav.timeline": { DE: "Verlauf", EN: "Timeline" },

  // Contractor role nav
  "cnav.jobs": { DE: "Aufträge", EN: "Assigned jobs" },
  "cnav.schedule": { DE: "Terminplan", EN: "Schedule" },
  "cnav.messages": { DE: "Nachrichten", EN: "Messages" },
  "cnav.completed": { DE: "Erledigt", EN: "Completed" },

  // Owner role nav
  "onav.properties": { DE: "Objekte", EN: "Properties" },
  "onav.issues": { DE: "Offene Fälle", EN: "Open issues" },
  "onav.financials": { DE: "Finanzübersicht", EN: "Financials" },
  "onav.approvals": { DE: "Freigaben", EN: "Approvals" },

  // Tenant dashboard
  "tdash.title": { DE: "Meine Anfragen", EN: "My requests" },
  "tdash.sub": { DE: "Wir kümmern uns – transparent und nachvollziehbar.", EN: "We're on it — transparent and traceable." },
  "tdash.hero_title": { DE: "Etwas in Ihrer Wohnung defekt?", EN: "Something broken in your home?" },
  "tdash.hero_sub": { DE: "Melden Sie es in 60 Sekunden – Valta strukturiert alles für die Hausverwaltung.", EN: "Report it in 60 seconds — Valta structures everything for property management." },
  "tdash.new_request": { DE: "Neue Meldung starten", EN: "Start a new report" },
  "tdash.active": { DE: "Aktive Anfragen", EN: "Active requests" },
  "tdash.resolved": { DE: "Abgeschlossen", EN: "Resolved" },
  "tdash.no_active": { DE: "Keine offenen Anfragen – alles in Ordnung.", EN: "No open requests — all good." },
  "tdash.opened": { DE: "Eingereicht", EN: "Opened" },
  "tdash.view": { DE: "Status verfolgen", EN: "Track status" },

  // Contractor dashboard
  "cdash.title": { DE: "Meine Aufträge", EN: "My assigned jobs" },
  "cdash.sub": { DE: "Nur das Wesentliche – damit Sie schnell loslegen können.", EN: "Only the essentials — so you can get started fast." },
  "cdash.today": { DE: "Heute", EN: "Today" },
  "cdash.this_week": { DE: "Diese Woche", EN: "This week" },
  "cdash.urgent": { DE: "Dringend", EN: "Urgent" },
  "cdash.address": { DE: "Adresse", EN: "Address" },
  "cdash.tenant_contact": { DE: "Mieterkontakt", EN: "Tenant contact" },
  "cdash.notes": { DE: "Reparaturhinweise", EN: "Repair notes" },
  "cdash.accept": { DE: "Auftrag annehmen", EN: "Accept job" },
  "cdash.request_info": { DE: "Rückfrage stellen", EN: "Request info" },
  "cdash.start": { DE: "Arbeit starten", EN: "Mark in progress" },
  "cdash.complete": { DE: "Als erledigt melden", EN: "Mark completed" },
  "cdash.directions": { DE: "Route", EN: "Directions" },
  "cdash.eta": { DE: "Geplant", EN: "Scheduled" },
  "cdash.kpi_active": { DE: "Aktive Aufträge", EN: "Active jobs" },
  "cdash.kpi_week": { DE: "Diese Woche fällig", EN: "Due this week" },
  "cdash.kpi_avg": { DE: "Ø Reaktionszeit", EN: "Avg. response" },
  "cdash.kpi_rating": { DE: "Bewertung", EN: "Rating" },
  "cdash.schedule_title": { DE: "Wochenplan", EN: "Weekly schedule" },
  "cdash.completed_title": { DE: "Abgeschlossene Aufträge", EN: "Completed jobs" },
  "cdash.messages_title": { DE: "Nachrichten von Hausverwaltungen", EN: "Messages from property managers" },

  // Owner dashboard
  "odash.title": { DE: "Portfolio-Übersicht", EN: "Portfolio overview" },
  "odash.sub": { DE: "Transparenz für Eigentümer · zentrale KPIs & Freigaben.", EN: "Transparency for owners — central KPIs and approvals." },
  "odash.kpi_units": { DE: "Wohneinheiten", EN: "Units" },
  "odash.kpi_open": { DE: "Offene Fälle", EN: "Open cases" },
  "odash.kpi_approvals": { DE: "Freigaben offen", EN: "Pending approvals" },
  "odash.kpi_costs": { DE: "Wartungskosten YTD", EN: "Maintenance YTD" },
  "odash.health": { DE: "Gebäude-Gesundheit", EN: "Building health" },
  "odash.health_sub": { DE: "AI-bewertet aus Wartungs- und Ticket-Historie.", EN: "AI-rated from maintenance and ticket history." },
  "odash.summary": { DE: "AI-Zusammenfassung Portfolio", EN: "AI portfolio summary" },
  "odash.summary_text": {
    DE: "3 ungelöste Heizungsfälle im Berliner Objekt deuten auf alternde Anlagen hin. Wartungsaufwand in München −18% MoM. Frankfurter Objekt stabil ohne kritische Vorfälle.",
    EN: "3 unresolved heating cases at the Berlin property suggest aging equipment. Maintenance load in Munich down 18% MoM. Frankfurt property stable with no critical incidents.",
  },
  "odash.approvals_title": { DE: "Ausstehende Freigaben", EN: "Pending approvals" },
  "odash.approvals_sub": { DE: "Hausverwaltung wartet auf Ihre Entscheidung.", EN: "Property management is awaiting your decision." },
  "odash.approve": { DE: "Freigeben", EN: "Approve" },
  "odash.reject": { DE: "Ablehnen", EN: "Decline" },
  "odash.cost_breakdown": { DE: "Kostenverteilung nach Kategorie", EN: "Cost breakdown by category" },
  "odash.recent_resolved": { DE: "Zuletzt abgeschlossen", EN: "Recently resolved" },
  "odash.issues_title": { DE: "Offene Reparaturfälle", EN: "Open maintenance cases" },
  "odash.financials_title": { DE: "Finanzübersicht", EN: "Financial overview" },
  "odash.approvals_page": { DE: "Freigaben", EN: "Approvals" },
} as const;

type Key = keyof typeof dict;

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: Key) => string }>({
  lang: "DE",
  setLang: () => {},
  t: (k) => dict[k].DE,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("DE");
  const t = (k: Key) => dict[k][lang];
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);

export function pick<T>(de: T, en: T, lang: Lang): T {
  return lang === "EN" ? en : de;
}
