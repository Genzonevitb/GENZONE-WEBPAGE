import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { X, Loader2, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";

type Accent = "cyan" | "pink" | "yellow";

interface DbEvent {
  id: string;
  title: string;
  image_url: string | null;
  accent: Accent;
  registration_open: boolean;
  registration_deadline: string | null;
  max_seats: number | null;
  form_mode: string;
  external_form_url: string | null;
}

interface FormField {
  id: string;
  label: string;
  type: string;
  options: string[] | null;
  required: boolean;
  sort_order: number;
  placeholder: string | null;
}

type FieldValue = string | string[];
type Answers = Record<string, FieldValue>;

const accentRing: Record<string, string> = {
  cyan: "ring-cyan/50 border-cyan",
  pink: "ring-pink/50 border-pink",
  yellow: "ring-yellow/50 border-yellow",
};
const accentText: Record<string, string> = {
  cyan: "text-cyan",
  pink: "text-pink",
  yellow: "text-yellow",
};
const accentBg: Record<string, string> = {
  cyan: "bg-cyan",
  pink: "bg-pink",
  yellow: "bg-yellow",
};

function inputCls(accent: Accent) {
  return `w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 ${accentRing[accent]} transition-all placeholder-white/20`;
}

interface Props {
  event: DbEvent;
  onClose: () => void;
}

type State = "loading" | "form" | "submitting" | "success" | "closed" | "deadline" | "full" | "duplicate" | "error";

export default function RegistrationModal({ event, onClose }: Props) {
  const [fields, setFields] = useState<FormField[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [state, setState] = useState<State>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const honeypotRef = useRef<HTMLInputElement>(null);
  const accent = (event.accent ?? "cyan") as Accent;

  // Escape key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Check registration status first
  useEffect(() => {
    if (!event.registration_open) { setState("closed"); return; }
    if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
      setState("deadline"); return;
    }
    // Load form fields
    supabase
      .from("event_form_fields")
      .select("*")
      .eq("event_id", event.id)
      .order("sort_order")
      .then(({ data }) => {
        setFields((data as FormField[]) ?? []);
        setState("form");
      });
  }, [event]);

  function setAnswer(fieldId: string, value: FieldValue) {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  }

  function toggleCheckbox(fieldId: string, option: string) {
    setAnswers((prev) => {
      const current = (prev[fieldId] as string[]) ?? [];
      return {
        ...prev,
        [fieldId]: current.includes(option)
          ? current.filter((v) => v !== option)
          : [...current, option],
      };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Honeypot check
    if (honeypotRef.current?.value) {
      setState("success"); // silently fake success
      return;
    }

    // Client-side validation
    for (const f of fields) {
      if (f.required) {
        const val = answers[f.id];
        if (f.type === "checkbox") {
          if (!val || (val as string[]).length === 0) {
            setErrorMsg(`"${f.label}" is required.`);
            setState("error");
            return;
          }
        } else {
          if (!val || (val as string).trim() === "") {
            setErrorMsg(`"${f.label}" is required.`);
            setState("error");
            return;
          }
          if (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val as string)) {
            setErrorMsg(`Please enter a valid email address.`);
            setState("error");
            return;
          }
          if (f.type === "phone" && !/^\d{10}$/.test((val as string).replace(/\D/g, ""))) {
            setErrorMsg(`Phone number must be 10 digits.`);
            setState("error");
            return;
          }
        }
      }
    }

    // Find email field for respondent_email
    const emailField = fields.find((f) => f.type === "email");
    const respondent_email = emailField ? ((answers[emailField.id] as string) ?? null) : null;

    setState("submitting");

    const { data, error } = await supabase.rpc("submit_registration", {
      p_event_id: event.id,
      p_answers: answers,
      p_respondent_email: respondent_email,
    });

    if (error) {
      setErrorMsg(error.message);
      setState("error");
      return;
    }

    const result = data as { success: boolean; error?: string; message?: string };
    if (!result.success) {
      const msg = result.error ?? "Registration failed.";
      if (msg.toLowerCase().includes("closed")) setState("closed");
      else if (msg.toLowerCase().includes("deadline")) setState("deadline");
      else if (msg.toLowerCase().includes("fully booked")) setState("full");
      else if (msg.toLowerCase().includes("already registered")) setState("duplicate");
      else { setErrorMsg(msg); setState("error"); }
    } else {
      setState("success");
    }
  }

  function renderField(f: FormField) {
    const val = answers[f.id];
    const ic = inputCls(accent);

    switch (f.type) {
      case "paragraph":
        return (
          <textarea
            value={(val as string) ?? ""}
            onChange={(e) => setAnswer(f.id, e.target.value)}
            rows={3}
            placeholder={f.placeholder ?? ""}
            className={`${ic} resize-none`}
          />
        );
      case "dropdown":
        return (
          <div className="relative">
            <select
              value={(val as string) ?? ""}
              onChange={(e) => setAnswer(f.id, e.target.value)}
              className={`${ic} appearance-none pr-8`}
            >
              <option value="">Select an option…</option>
              {(f.options ?? []).map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          </div>
        );
      case "radio":
        return (
          <div className="space-y-2">
            {(f.options ?? []).map((o) => (
              <label key={o} className="flex items-center gap-3 cursor-pointer group">
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${(val as string) === o ? `border-${accent} bg-${accent}/20` : "border-white/20"}`}>
                  {(val as string) === o && <span className={`w-1.5 h-1.5 rounded-full ${accentBg[accent]}`} />}
                </span>
                <input type="radio" className="sr-only" value={o} checked={(val as string) === o} onChange={() => setAnswer(f.id, o)} />
                <span className="font-mono text-sm text-white/80 group-hover:text-white transition-colors">{o}</span>
              </label>
            ))}
          </div>
        );
      case "checkbox":
        return (
          <div className="space-y-2">
            {(f.options ?? []).map((o) => {
              const checked = ((val as string[]) ?? []).includes(o);
              return (
                <label key={o} className="flex items-center gap-3 cursor-pointer group">
                  <span className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${checked ? `border-${accent} ${accentBg[accent]}/20` : "border-white/20"}`}>
                    {checked && <span className="text-[10px] text-white font-bold">✓</span>}
                  </span>
                  <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleCheckbox(f.id, o)} />
                  <span className="font-mono text-sm text-white/80 group-hover:text-white transition-colors">{o}</span>
                </label>
              );
            })}
          </div>
        );
      default: {
        const typeMap: Record<string, string> = {
          email: "email", phone: "tel", number: "number", date: "date",
          short_text: "text",
        };
        return (
          <input
            type={typeMap[f.type] ?? "text"}
            value={(val as string) ?? ""}
            onChange={(e) => setAnswer(f.id, e.target.value)}
            placeholder={f.placeholder ?? ""}
            className={ic}
          />
        );
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      {/* Modal panel */}
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] bg-[#0a0a0a] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/10 shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <p className={`font-mono text-[10px] uppercase tracking-widest mb-1 ${accentText[accent]}`}>
              Registration
            </p>
            <h2 className="font-display text-xl font-black text-white leading-tight truncate">
              {event.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Loading skeleton */}
          {state === "loading" && (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse space-y-1.5">
                  <div className="h-3 bg-white/10 rounded w-24" />
                  <div className="h-10 bg-white/5 rounded-lg" />
                </div>
              ))}
            </div>
          )}

          {/* Success */}
          {state === "success" && (
            <div className="p-10 text-center space-y-4">
              <div className="text-5xl">🎉</div>
              <h3 className={`font-display text-3xl font-black ${accentText[accent]}`}>You&apos;re in!</h3>
              <p className="font-mono text-sm text-white/60">Successfully registered for</p>
              <p className="font-display text-lg font-bold text-white">{event.title}</p>
              <button
                onClick={onClose}
                className={`mt-4 font-mono text-xs uppercase tracking-widest px-6 py-2.5 rounded-xl border transition-all ${accentText[accent]} border-current hover:bg-white/5`}
              >
                Close
              </button>
            </div>
          )}

          {/* Closed */}
          {state === "closed" && (
            <StatusBanner icon="🔒" title="Registrations Closed" message="The organizers have closed registrations for this event." onClose={onClose} />
          )}

          {/* Deadline passed */}
          {state === "deadline" && (
            <StatusBanner icon="⏰" title="Deadline Passed" message="The registration deadline for this event has passed." onClose={onClose} />
          )}

          {/* Fully booked */}
          {state === "full" && (
            <StatusBanner icon="🎟️" title="Fully Booked" message="All seats for this event have been taken." onClose={onClose} />
          )}

          {/* Already registered */}
          {state === "duplicate" && (
            <StatusBanner icon="✅" title="Already Registered" message="You've already registered for this event with this email address." onClose={onClose} />
          )}

          {/* Error */}
          {state === "error" && (
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3 bg-pink/10 border border-pink/30 rounded-xl p-4">
                <AlertCircle size={18} className="text-pink shrink-0 mt-0.5" />
                <p className="font-mono text-sm text-pink">{errorMsg}</p>
              </div>
              <button
                onClick={() => setState("form")}
                className="font-mono text-xs uppercase tracking-widest text-white/60 hover:text-white transition-colors"
              >
                ← Back to form
              </button>
            </div>
          )}

          {/* Form */}
          {state === "form" && (
            <form onSubmit={handleSubmit} noValidate>
              {/* Honeypot */}
              <input
                ref={honeypotRef}
                name="website"
                type="text"
                tabIndex={-1}
                aria-hidden="true"
                style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0 }}
              />

              <div className="p-6 space-y-5">
                {fields.length === 0 && (
                  <p className="font-mono text-sm text-white/40 text-center py-6">
                    No form fields configured for this event.
                  </p>
                )}
                {fields.map((f) => (
                  <div key={f.id}>
                    <label className="block font-mono text-[10px] text-white/50 uppercase tracking-widest mb-1.5">
                      {f.label}
                      {f.required && <span className="text-pink ml-1">*</span>}
                    </label>
                    {renderField(f)}
                  </div>
                ))}
              </div>

              <div className="p-6 pt-2 border-t border-white/10 shrink-0">
                <button
                  type="submit"
                  disabled={state === "submitting"}
                  className={`w-full flex items-center justify-center gap-2 font-mono text-sm uppercase tracking-widest py-3 rounded-xl transition-all disabled:opacity-50 ${accentText[accent]} bg-white/5 border border-current hover:bg-white/10`}
                >
                  {state === "submitting" && <Loader2 size={14} className="animate-spin" />}
                  {state === "submitting" ? "Registering…" : "Register Now"}
                </button>
              </div>
            </form>
          )}

          {/* Submitting overlay */}
          {state === "submitting" && (
            <div className="p-6 flex flex-col items-center justify-center gap-4 py-16">
              <Loader2 size={32} className={`animate-spin ${accentText[accent]}`} />
              <p className="font-mono text-sm text-white/60">Submitting your registration…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBanner({ icon, title, message, onClose }: { icon: string; title: string; message: string; onClose: () => void }) {
  return (
    <div className="p-10 text-center space-y-4">
      <div className="text-5xl">{icon}</div>
      <h3 className="font-display text-2xl font-black text-white">{title}</h3>
      <p className="font-mono text-sm text-white/60">{message}</p>
      <button
        onClick={onClose}
        className="mt-4 font-mono text-xs uppercase tracking-widest px-6 py-2.5 rounded-xl border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all"
      >
        Close
      </button>
    </div>
  );
}
