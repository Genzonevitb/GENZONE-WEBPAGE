import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  Plus, Trash2, ChevronUp, ChevronDown, Save,
  Loader2, GripVertical, FileText,
} from 'lucide-react'
import ConfirmDialog from './ConfirmDialog'

type FieldType = 'short_text' | 'paragraph' | 'email' | 'phone' | 'number' | 'dropdown' | 'radio' | 'checkbox' | 'date'

interface FormField {
  id: string
  label: string
  type: FieldType
  options: string[] | null
  required: boolean
  sort_order: number
  placeholder: string | null
}

interface RegSettings {
  registration_open: boolean
  registration_deadline: string | null
  max_seats: number | null
  one_response_per_email: boolean
  form_mode: 'builtin' | 'external'
  external_form_url: string | null
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'short_text', label: 'Short Text' },
  { value: 'paragraph',  label: 'Paragraph' },
  { value: 'email',      label: 'Email' },
  { value: 'phone',      label: 'Phone' },
  { value: 'number',     label: 'Number' },
  { value: 'dropdown',   label: 'Dropdown' },
  { value: 'radio',      label: 'Radio' },
  { value: 'checkbox',   label: 'Checkbox' },
  { value: 'date',       label: 'Date' },
]

const BASIC_TEMPLATE: Omit<FormField, 'id' | 'sort_order'>[] = [
  { label: 'Full Name',                type: 'short_text', required: true,  placeholder: 'Your full name',          options: null },
  { label: 'Email',                    type: 'email',      required: true,  placeholder: 'your@email.com',          options: null },
  { label: 'Phone Number',             type: 'phone',      required: true,  placeholder: '10-digit mobile number',  options: null },
  { label: 'VIT Registration Number',  type: 'short_text', required: true,  placeholder: 'e.g. 23BAI10001',         options: null },
  { label: 'Branch & Year',            type: 'short_text', required: true,  placeholder: 'e.g. CSE 2nd Year',       options: null },
]

const HAS_OPTIONS: FieldType[] = ['dropdown', 'radio', 'checkbox']

const ic = `w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all`
const icy = `w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-yellow/50 focus:border-yellow transition-all`

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-cyan' : 'bg-border'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

export default function EventFormBuilder({ eventId }: { eventId: string }) {
  const [fields, setFields]       = useState<FormField[]>([])
  const [loading, setLoading]     = useState(true)
  const [regSettings, setReg]     = useState<RegSettings>({
    registration_open: true, registration_deadline: null, max_seats: null,
    one_response_per_email: true, form_mode: 'builtin', external_form_url: null,
  })
  const [savingSettings, setSavingSettings] = useState(false)
  const [regCount, setRegCount]   = useState(0)

  // Add field
  const [addLabel, setAddLabel]         = useState('')
  const [addType, setAddType]           = useState<FieldType>('short_text')
  const [addRequired, setAddRequired]   = useState(false)
  const [addOptions, setAddOptions]     = useState('')
  const [addPlaceholder, setAddPlaceholder] = useState('')
  const [adding, setAdding]             = useState(false)

  // Inline edit
  const [editingId, setEditingId]       = useState<string | null>(null)
  const [editForm, setEditForm]         = useState<Partial<FormField & { optionsText: string }>>({})
  const [savingField, setSavingField]   = useState(false)

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<FormField | null>(null)
  const [deleting, setDeleting]         = useState(false)

  // Copy from event
  const [otherEvents, setOtherEvents]   = useState<{ id: string; title: string }[]>([])
  const [copying, setCopying]           = useState(false)
  const [applyingTpl, setApplyingTpl]   = useState(false)

  useEffect(() => { fetchAll(); fetchOtherEvents() }, [eventId])

  async function fetchAll() {
    setLoading(true)
    const [fieldsRes, eventRes, regRes] = await Promise.all([
      supabase.from('event_form_fields').select('*').eq('event_id', eventId).order('sort_order'),
      supabase.from('events')
        .select('registration_open, registration_deadline, max_seats, one_response_per_email, form_mode, external_form_url')
        .eq('id', eventId).single(),
      supabase.from('event_registrations').select('id', { count: 'exact', head: true }).eq('event_id', eventId),
    ])
    if (fieldsRes.data) setFields(fieldsRes.data as FormField[])
    if (eventRes.data) {
      const d = eventRes.data
      setReg({
        registration_open: d.registration_open ?? true,
        registration_deadline: d.registration_deadline ?? null,
        max_seats: d.max_seats ?? null,
        one_response_per_email: d.one_response_per_email ?? true,
        form_mode: (d.form_mode as 'builtin' | 'external') ?? 'builtin',
        external_form_url: d.external_form_url ?? null,
      })
    }
    if (regRes.count !== null) setRegCount(regRes.count)
    setLoading(false)
  }

  async function fetchOtherEvents() {
    const { data } = await supabase.from('events').select('id, title').neq('id', eventId).order('title')
    if (data) setOtherEvents(data)
  }

  async function saveSettings() {
    setSavingSettings(true)
    const { error } = await supabase.from('events').update({
      registration_open: regSettings.registration_open,
      registration_deadline: regSettings.registration_deadline || null,
      max_seats: regSettings.max_seats,
      one_response_per_email: regSettings.one_response_per_email,
      form_mode: regSettings.form_mode,
      external_form_url: regSettings.external_form_url || null,
    }).eq('id', eventId)
    if (error) toast.error('Failed to save settings: ' + error.message)
    else toast.success('Registration settings saved!')
    setSavingSettings(false)
  }

  async function addField() {
    if (!addLabel.trim()) { toast.error('Label is required.'); return }
    setAdding(true)
    const nextOrder = fields.length > 0 ? Math.max(...fields.map(f => f.sort_order)) + 1 : 0
    const opts = HAS_OPTIONS.includes(addType) && addOptions.trim()
      ? addOptions.split('\n').map(o => o.trim()).filter(Boolean) : null
    const { error } = await supabase.from('event_form_fields').insert([{
      event_id: eventId, label: addLabel.trim(), type: addType,
      options: opts, required: addRequired, sort_order: nextOrder,
      placeholder: addPlaceholder.trim() || null,
    }])
    if (error) toast.error('Failed to add field: ' + error.message)
    else {
      toast.success('Field added!')
      setAddLabel(''); setAddType('short_text'); setAddRequired(false)
      setAddOptions(''); setAddPlaceholder('')
      fetchAll()
    }
    setAdding(false)
  }

  async function saveField() {
    if (!editingId || !editForm.label?.trim()) return
    setSavingField(true)
    const hasOpts = editForm.type && HAS_OPTIONS.includes(editForm.type)
    const opts = hasOpts && editForm.optionsText
      ? editForm.optionsText.split('\n').map(o => o.trim()).filter(Boolean) : null
    const { error } = await supabase.from('event_form_fields').update({
      label: editForm.label?.trim(), type: editForm.type,
      options: opts, required: editForm.required,
      placeholder: editForm.placeholder || null,
    }).eq('id', editingId)
    if (error) toast.error('Failed to save: ' + error.message)
    else { toast.success('Field updated!'); setEditingId(null); fetchAll() }
    setSavingField(false)
  }

  async function deleteField() {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.from('event_form_fields').delete().eq('id', deleteTarget.id)
    if (error) toast.error('Failed to delete.')
    else { toast.success('Field deleted.'); setDeleteTarget(null); fetchAll() }
    setDeleting(false)
  }

  async function moveField(id: string, dir: 'up' | 'down') {
    const idx = fields.findIndex(f => f.id === id)
    if (idx === -1) return
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= fields.length) return
    const a = fields[idx], b = fields[swapIdx]
    await Promise.all([
      supabase.from('event_form_fields').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('event_form_fields').update({ sort_order: a.sort_order }).eq('id', b.id),
    ])
    fetchAll()
  }

  async function applyTemplate() {
    setApplyingTpl(true)
    const start = fields.length > 0 ? Math.max(...fields.map(f => f.sort_order)) + 1 : 0
    const rows = BASIC_TEMPLATE.map((f, i) => ({
      event_id: eventId, ...f, sort_order: start + i,
    }))
    const { error } = await supabase.from('event_form_fields').insert(rows)
    if (error) toast.error('Failed to apply template.')
    else { toast.success('Basic template applied!'); fetchAll() }
    setApplyingTpl(false)
  }

  async function copyFromEvent(sourceId: string) {
    if (!sourceId) return
    setCopying(true)
    const { data } = await supabase.from('event_form_fields').select('*').eq('event_id', sourceId).order('sort_order')
    if (!data || data.length === 0) { toast.info('That event has no form fields.'); setCopying(false); return }
    const start = fields.length > 0 ? Math.max(...fields.map(f => f.sort_order)) + 1 : 0
    const rows = data.map((f: any, i: number) => ({
      event_id: eventId, label: f.label, type: f.type,
      options: f.options, required: f.required, sort_order: start + i, placeholder: f.placeholder,
    }))
    const { error } = await supabase.from('event_form_fields').insert(rows)
    if (error) toast.error('Failed to copy fields.')
    else { toast.success(`Copied ${rows.length} field(s)!`); fetchAll() }
    setCopying(false)
  }

  if (loading) return (
    <div className="p-6 space-y-4 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-background rounded-lg" />)}
    </div>
  )

  return (
    <div className="p-6 space-y-8">

      {/* ── Registration Settings ── */}
      <section>
        <p className="font-mono text-[10px] text-cyan uppercase tracking-widest mb-4">Registration Settings</p>
        <div className="space-y-4">

          <div className="flex items-center justify-between bg-background border border-border rounded-lg px-4 py-3">
            <div>
              <p className="font-mono text-xs text-white">Registration Open</p>
              <p className="font-mono text-[10px] text-muted-foreground">Allow new registrations</p>
            </div>
            <Toggle value={regSettings.registration_open} onChange={() => setReg(p => ({ ...p, registration_open: !p.registration_open }))} />
          </div>

          <div className="flex items-center justify-between bg-background border border-border rounded-lg px-4 py-3">
            <div>
              <p className="font-mono text-xs text-white">One Response Per Email</p>
              <p className="font-mono text-[10px] text-muted-foreground">Prevent duplicate submissions</p>
            </div>
            <Toggle value={regSettings.one_response_per_email} onChange={() => setReg(p => ({ ...p, one_response_per_email: !p.one_response_per_email }))} />
          </div>

          <div>
            <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
              Registration Deadline
            </label>
            <input
              type="datetime-local"
              value={regSettings.registration_deadline?.slice(0, 16) ?? ''}
              onChange={e => setReg(p => ({ ...p, registration_deadline: e.target.value || null }))}
              className={ic}
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
              Seat Limit {regSettings.max_seats && regCount > 0 ? `— ${regCount} / ${regSettings.max_seats} filled` : ''}
            </label>
            <input
              type="number"
              min={1}
              value={regSettings.max_seats ?? ''}
              onChange={e => setReg(p => ({ ...p, max_seats: e.target.value ? parseInt(e.target.value) : null }))}
              placeholder="Leave empty for unlimited"
              className={ic}
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">Form Mode</label>
            <div className="flex gap-2">
              {(['builtin', 'external'] as const).map(m => (
                <button
                  key={m} type="button"
                  onClick={() => setReg(p => ({ ...p, form_mode: m }))}
                  className={`flex-1 py-2.5 rounded-lg font-mono text-xs uppercase tracking-widest border transition-all ${regSettings.form_mode === m ? 'border-cyan bg-cyan/10 text-cyan' : 'border-border text-muted-foreground hover:border-cyan/40'}`}
                >
                  {m === 'builtin' ? 'Built-in Form' : 'External Link'}
                </button>
              ))}
            </div>
          </div>

          {regSettings.form_mode === 'external' && (
            <div>
              <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">External Form URL</label>
              <input
                type="url"
                value={regSettings.external_form_url ?? ''}
                onChange={e => setReg(p => ({ ...p, external_form_url: e.target.value }))}
                placeholder="https://forms.google.com/..."
                className={ic}
              />
            </div>
          )}

          <button
            type="button" onClick={saveSettings} disabled={savingSettings}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-semibold uppercase tracking-widest bg-cyan/10 border border-cyan/40 hover:border-cyan text-cyan hover:bg-cyan/20 disabled:opacity-40 transition-all"
          >
            {savingSettings ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {savingSettings ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </section>

      {/* ── Form Fields (builtin only) ── */}
      {regSettings.form_mode === 'builtin' && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <p className="font-mono text-[10px] text-pink uppercase tracking-widest">
              Form Fields ({fields.length})
            </p>
            <div className="flex gap-2">
              <button
                type="button" onClick={applyTemplate} disabled={applyingTpl}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-widest border border-yellow/40 text-yellow hover:bg-yellow/10 transition-all disabled:opacity-40"
              >
                <FileText size={11} />
                {applyingTpl ? 'Applying…' : 'Basic Template'}
              </button>
              {otherEvents.length > 0 && (
                <select
                  defaultValue=""
                  onChange={e => { if (e.target.value) copyFromEvent(e.target.value); e.currentTarget.value = '' }}
                  disabled={copying}
                  className="bg-background border border-border rounded-lg px-2 py-1.5 text-muted-foreground font-mono text-[10px] focus:outline-none focus:border-cyan transition-all"
                >
                  <option value="" disabled>{copying ? 'Copying…' : 'Copy from event…'}</option>
                  {otherEvents.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
              )}
            </div>
          </div>

          {/* Fields list */}
          <div className="space-y-2 mb-6">
            {fields.length === 0 && (
              <p className="font-mono text-xs text-muted-foreground py-6 text-center border border-dashed border-border rounded-xl">
                No fields yet — use the template or add below.
              </p>
            )}
            {fields.map((field, i) => (
              <div key={field.id} className="border border-border rounded-xl overflow-hidden">
                {/* Row header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-background">
                  <GripVertical size={14} className="text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-xs text-white">{field.label}</span>
                    <span className="ml-2 font-mono text-[10px] text-muted-foreground">{field.type.replace('_', ' ')}</span>
                    {field.required && <span className="ml-2 font-mono text-[10px] text-pink">required</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => moveField(field.id, 'up')} disabled={i === 0} className="p-1 text-muted-foreground hover:text-cyan disabled:opacity-30"><ChevronUp size={13} /></button>
                    <button type="button" onClick={() => moveField(field.id, 'down')} disabled={i === fields.length - 1} className="p-1 text-muted-foreground hover:text-cyan disabled:opacity-30"><ChevronDown size={13} /></button>
                    <button
                      type="button"
                      onClick={() => {
                        if (editingId === field.id) { setEditingId(null) }
                        else {
                          setEditingId(field.id)
                          setEditForm({ ...field, optionsText: (field.options ?? []).join('\n') })
                        }
                      }}
                      className="px-2 py-1 font-mono text-[10px] text-muted-foreground hover:text-cyan transition-colors"
                    >
                      {editingId === field.id ? 'Close' : 'Edit'}
                    </button>
                    <button type="button" onClick={() => setDeleteTarget(field)} className="p-1 text-muted-foreground hover:text-pink"><Trash2 size={13} /></button>
                  </div>
                </div>

                {/* Inline editor */}
                {editingId === field.id && (
                  <div className="border-t border-border bg-charcoal p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Label</label>
                        <input type="text" value={editForm.label ?? ''} onChange={e => setEditForm(p => ({ ...p, label: e.target.value }))} className={ic} />
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Type</label>
                        <select value={editForm.type ?? 'short_text'} onChange={e => setEditForm(p => ({ ...p, type: e.target.value as FieldType }))} className={ic}>
                          {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Placeholder</label>
                      <input type="text" value={editForm.placeholder ?? ''} onChange={e => setEditForm(p => ({ ...p, placeholder: e.target.value }))} className={ic} />
                    </div>
                    {editForm.type && HAS_OPTIONS.includes(editForm.type) && (
                      <div>
                        <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Options (one per line)</label>
                        <textarea rows={3} value={editForm.optionsText ?? ''} onChange={e => setEditForm(p => ({ ...p, optionsText: e.target.value }))} className={`${ic} resize-none`} />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={editForm.required ?? false} onChange={e => setEditForm(p => ({ ...p, required: e.target.checked }))} className="accent-pink" />
                        <span className="font-mono text-xs text-white">Required</span>
                      </label>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg font-mono text-xs border border-border text-muted-foreground hover:text-white transition-all">Cancel</button>
                        <button type="button" onClick={saveField} disabled={savingField} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs bg-cyan/10 border border-cyan/40 text-cyan hover:bg-cyan/20 transition-all disabled:opacity-40">
                          {savingField ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add field */}
          <div className="border border-dashed border-border rounded-xl p-4 space-y-3">
            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Add Field</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Label</label>
                <input type="text" value={addLabel} onChange={e => setAddLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && addField()} placeholder="e.g. Full Name" className={icy} />
              </div>
              <div>
                <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Type</label>
                <select value={addType} onChange={e => setAddType(e.target.value as FieldType)} className={icy}>
                  {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Placeholder (optional)</label>
              <input type="text" value={addPlaceholder} onChange={e => setAddPlaceholder(e.target.value)} className={icy} />
            </div>
            {HAS_OPTIONS.includes(addType) && (
              <div>
                <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Options (one per line)</label>
                <textarea rows={3} value={addOptions} onChange={e => setAddOptions(e.target.value)} className={`${icy} resize-none`} />
              </div>
            )}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={addRequired} onChange={e => setAddRequired(e.target.checked)} className="accent-pink" />
                <span className="font-mono text-xs text-white">Required</span>
              </label>
              <button
                type="button" onClick={addField} disabled={adding || !addLabel.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-semibold uppercase tracking-widest border border-yellow text-yellow hover:bg-yellow/10 disabled:opacity-40 transition-all"
              >
                <Plus size={13} />
                {adding ? 'Adding…' : 'Add Field'}
              </button>
            </div>
          </div>
        </section>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={open => !open && setDeleteTarget(null)}
        onConfirm={deleteField}
        loading={deleting}
        title="Delete Field?"
        description={`Delete "${deleteTarget?.label}"?${regCount > 0 ? ` This event already has ${regCount} response(s) — their data for this field won't be shown in future views but is not erased.` : ' This cannot be undone.'}`}
        confirmLabel="Delete Field"
      />
    </div>
  )
}
