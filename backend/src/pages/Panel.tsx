import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { uploadImage } from '@/lib/uploadImage'
import { toast } from 'sonner'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Users,
  Loader2,
  ChevronUp,
  ChevronDown,
  UserCircle2,
} from 'lucide-react'
import ImageDropzone from '@/components/ImageDropzone'
import ConfirmDialog from '@/components/ConfirmDialog'

interface PanelMember {
  id: string
  name: string
  role: string
  accent: string | null
  portrait_url: string | null
  portrait_path: string | null
  sort_order: number
  created_at: string
}

const ACCENTS = [
  { value: 'cyan', label: 'Cyan', color: 'oklch(0.8 0.15 220)' },
  { value: 'pink', label: 'Pink', color: 'oklch(0.64 0.26 0)' },
  { value: 'yellow', label: 'Yellow', color: 'oklch(0.88 0.18 92)' },
]

function AccentDot({ accent }: { accent: string | null }) {
  const color = ACCENTS.find((a) => a.value === accent)?.color ?? '#888'
  return (
    <span
      className="inline-block w-3 h-3 rounded-full border border-white/20 shrink-0"
      style={{ background: color }}
    />
  )
}

interface FormState {
  name: string
  role: string
  accent: string
  sort_order: number
}

const EMPTY_FORM: FormState = {
  name: '',
  role: '',
  accent: 'cyan',
  sort_order: 0,
}

function MemberCard({
  member,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  member: PanelMember
  onEdit: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
}) {
  const accentMap: Record<string, string> = {
    cyan: 'border-cyan/20',
    pink: 'border-pink/20',
    yellow: 'border-yellow/20',
  }
  const borderCls = accentMap[member.accent ?? ''] ?? 'border-border'

  return (
    <div className={`bg-charcoal border ${borderCls} rounded-2xl p-4 flex flex-col gap-3 hover:scale-[1.01] transition-transform`}>
      {/* Portrait */}
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-background border border-border shrink-0">
          {member.portrait_url ? (
            <img
              src={member.portrait_url}
              alt={member.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <UserCircle2 size={28} className="text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <AccentDot accent={member.accent} />
            <span className="font-display text-sm font-bold text-white truncate">{member.name}</span>
          </div>
          <p className="font-mono text-xs text-muted-foreground truncate">{member.role}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <div className="flex items-center gap-1">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="p-1 rounded text-muted-foreground hover:text-white disabled:opacity-30 transition-all"
          >
            <ChevronUp size={14} />
          </button>
          <span className="font-mono text-[10px] text-muted-foreground w-6 text-center">
            {member.sort_order}
          </span>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="p-1 rounded text-muted-foreground hover:text-white disabled:opacity-30 transition-all"
          >
            <ChevronDown size={14} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-cyan hover:bg-cyan/10 transition-all"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-pink hover:bg-pink/10 transition-all"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Panel() {
  const [members, setMembers] = useState<PanelMember[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<PanelMember | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [portraitFile, setPortraitFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PanelMember | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function fetchMembers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('panel_members')
      .select('*')
      .order('sort_order', { ascending: true })
    if (error) toast.error(error.message)
    else setMembers((data as PanelMember[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchMembers() }, [])

  function openAdd() {
    setEditing(null)
    setForm({ ...EMPTY_FORM, sort_order: (members[members.length - 1]?.sort_order ?? 0) + 1 })
    setPortraitFile(null)
    setSheetOpen(true)
  }

  function openEdit(member: PanelMember) {
    setEditing(member)
    setForm({
      name: member.name,
      role: member.role,
      accent: member.accent ?? 'cyan',
      sort_order: member.sort_order,
    })
    setPortraitFile(null)
    setSheetOpen(true)
  }

  function closeSheet() {
    setSheetOpen(false)
    setEditing(null)
    setPortraitFile(null)
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Name is required.'); return }
    if (!form.role.trim()) { toast.error('Role is required.'); return }
    setSaving(true)
    try {
      let portrait_url: string | null = editing?.portrait_url ?? null
      let portrait_path: string | null = editing?.portrait_path ?? null

      if (portraitFile) {
        if (editing?.portrait_path) {
          await supabase.storage.from('panel').remove([editing.portrait_path])
        }
        const result = await uploadImage(portraitFile, 'panel', 600, 0.1)
        portrait_url = result.url
        portrait_path = result.path
      }

      const payload = {
        name: form.name.trim(),
        role: form.role.trim(),
        accent: form.accent,
        sort_order: form.sort_order,
        portrait_url,
        portrait_path,
      }

      if (editing) {
        const { error } = await supabase.from('panel_members').update(payload).eq('id', editing.id)
        if (error) throw error
        toast.success('Member updated.')
      } else {
        const { error } = await supabase.from('panel_members').insert(payload)
        if (error) throw error
        toast.success('Member added.')
      }

      closeSheet()
      await fetchMembers()
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to save member.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      if (deleteTarget.portrait_path) {
        await supabase.storage.from('panel').remove([deleteTarget.portrait_path])
      }
      const { error } = await supabase.from('panel_members').delete().eq('id', deleteTarget.id)
      if (error) throw error
      toast.success('Member removed.')
      setDeleteTarget(null)
      await fetchMembers()
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to delete member.')
    } finally {
      setDeleting(false)
    }
  }

  async function moveMember(index: number, direction: 'up' | 'down') {
    const newMembers = [...members]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= newMembers.length) return

    const aOrder = newMembers[index].sort_order
    const bOrder = newMembers[swapIndex].sort_order

    // Swap sort_order values
    const updates = [
      supabase.from('panel_members').update({ sort_order: bOrder }).eq('id', newMembers[index].id),
      supabase.from('panel_members').update({ sort_order: aOrder }).eq('id', newMembers[swapIndex].id),
    ]
    await Promise.all(updates)
    await fetchMembers()
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-black text-white tracking-tight">Panel Members</h1>
          <p className="font-mono text-sm text-muted-foreground mt-1">
            Manage the club leadership and core team.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-yellow/10 border border-yellow/40 hover:border-yellow text-yellow font-mono text-sm px-4 py-2.5 rounded-xl transition-all hover:bg-yellow/20"
        >
          <Plus size={16} />
          Add Member
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-charcoal border border-border rounded-2xl p-4 animate-pulse h-36" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="bg-charcoal border border-border rounded-2xl p-16 text-center">
          <Users size={40} className="text-muted-foreground mx-auto mb-3" />
          <p className="font-mono text-sm text-muted-foreground">No members yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {members.map((member, index) => (
            <MemberCard
              key={member.id}
              member={member}
              onEdit={() => openEdit(member)}
              onDelete={() => setDeleteTarget(member)}
              onMoveUp={() => moveMember(index, 'up')}
              onMoveDown={() => moveMember(index, 'down')}
              isFirst={index === 0}
              isLast={index === members.length - 1}
            />
          ))}
        </div>
      )}

      {/* Sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={closeSheet} />
          <div className="w-full max-w-md bg-sidebar border-l border-border flex flex-col h-full overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-sidebar z-10">
              <h2 className="font-display text-xl font-bold text-white">
                {editing ? 'Edit Member' : 'New Member'}
              </h2>
              <button onClick={closeSheet} className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-border/40 transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 flex-1">
              {/* Name */}
              <div>
                <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                  Name <span className="text-pink">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                  placeholder="Full name"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                  Role <span className="text-pink">*</span>
                </label>
                <input
                  type="text"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                  placeholder="e.g. President, Design Lead"
                />
              </div>

              {/* Accent + Sort */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                    Accent
                  </label>
                  <select
                    value={form.accent}
                    onChange={(e) => setForm({ ...form, accent: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                  >
                    {ACCENTS.map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                  />
                </div>
              </div>

              {/* Portrait */}
              <div>
                <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                  Portrait Photo
                </label>
                <ImageDropzone
                  onFile={setPortraitFile}
                  currentUrl={editing?.portrait_url ?? undefined}
                  label="Drop portrait here or click to browse"
                  maxMB={5}
                />
                {portraitFile && (
                  <p className="font-mono text-[10px] text-cyan mt-1.5">
                    New file selected: {portraitFile.name}
                  </p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-border flex gap-3 sticky bottom-0 bg-sidebar">
              <button
                onClick={closeSheet}
                className="flex-1 bg-background border border-border text-muted-foreground font-mono text-sm py-2.5 rounded-xl hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-yellow/10 border border-yellow/40 hover:border-yellow text-yellow font-mono text-sm py-2.5 rounded-xl transition-all hover:bg-yellow/20 disabled:opacity-50"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? 'Saving…' : editing ? 'Update Member' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Remove Member?"
        description={`Are you sure you want to remove "${deleteTarget?.name}"? Their portrait will also be deleted. This action cannot be undone.`}
        confirmLabel="Remove Member"
      />
    </div>
  )
}
