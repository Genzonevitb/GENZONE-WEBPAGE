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
  EyeOff,
  CreditCard,
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
  department?: string | null
  year_batch?: string | null
  bio?: string | null
  quote?: string | null
  skills?: string[] | null
  achievements?: string[] | null
  fun_fact?: string | null
  joined_date?: string | null
  social_instagram?: string | null
  social_linkedin?: string | null
  instagram_url?: string | null
  linkedin_url?: string | null
  social_github?: string | null
  social_x?: string | null
  social_email?: string | null
  social_portfolio?: string | null
  github_url?: string | null
  x_url?: string | null
  portfolio_url?: string | null
  social_visibility?: Record<string, boolean> | null
  social_custom_url?: string | null
  social_custom_label?: string | null
  focal_point?: string | null
  accent_color_hex?: string | null
  hidden?: boolean
  show_fields?: any
  member_code?: string | null
  card_overrides?: Record<string, any> | null
}

const ACCENTS = [
  { value: 'cyan', label: 'Cyan', color: 'oklch(0.8 0.15 220)' },
  { value: 'pink', label: 'Pink', color: 'oklch(0.64 0.26 0)' },
  { value: 'yellow', label: 'Yellow', color: 'oklch(0.88 0.18 92)' },
]

function AccentDot({ accent, customHex }: { accent: string | null; customHex?: string | null }) {
  const color = customHex?.trim() || ACCENTS.find((a) => a.value === accent)?.color || '#888'
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
  department: string
  year_batch: string
  bio: string
  quote: string
  skills: string
  achievements: string
  fun_fact: string
  joined_date: string
  social_instagram: string
  social_linkedin: string
  instagram_url: string
  linkedin_url: string
  github_url: string
  x_url: string
  portfolio_url: string
  social_github: string
  social_x: string
  social_email: string
  social_portfolio: string
  social_visibility: Record<string, boolean>
  social_custom_label: string
  social_custom_url: string
  focal_point: string
  accent_color_hex: string
  hidden: boolean
  member_code: string
  card_overrides_finish: string
  card_overrides_orientation: string
  card_overrides_strapColor: string
}

const EMPTY_FORM: FormState = {
  name: '',
  role: '',
  accent: 'cyan',
  sort_order: 0,
  department: '',
  year_batch: '',
  bio: '',
  quote: '',
  skills: '',
  achievements: '',
  fun_fact: '',
  joined_date: '',
  social_instagram: '',
  social_linkedin: '',
  instagram_url: '',
  linkedin_url: '',
  github_url: '',
  x_url: '',
  portfolio_url: '',
  social_github: '',
  social_x: '',
  social_email: '',
  social_portfolio: '',
  social_visibility: {
    instagram: true,
    linkedin: true,
    github: true,
    x: true,
    portfolio: true,
    email: true,
  },
  social_custom_label: '',
  social_custom_url: '',
  focal_point: '50% 50%',
  accent_color_hex: '#00ffff',
  hidden: false,
  member_code: '',
  card_overrides_finish: '',
  card_overrides_orientation: '',
  card_overrides_strapColor: '',
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
    <div className={`bg-charcoal border ${borderCls} rounded-2xl p-4 flex flex-col gap-3 hover:scale-[1.01] transition-transform ${member.hidden ? 'opacity-60' : ''}`}>
      {/* Portrait + Info */}
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-background border border-border shrink-0 relative">
          {member.portrait_url ? (
            <img
              src={member.portrait_url}
              alt={member.name}
              style={{ objectPosition: member.focal_point || '50% 50%' }}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <UserCircle2 size={28} className="text-muted-foreground" />
            </div>
          )}
          {member.hidden && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <EyeOff size={16} className="text-white/80" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <AccentDot accent={member.accent} customHex={member.accent_color_hex} />
            <span className="font-display text-sm font-bold text-white truncate">{member.name}</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-cyan border border-cyan/30">
              {`GZ-${String(Math.max(1, member.sort_order || 1)).padStart(3, '0')}`}
            </span>
            {member.hidden && (
              <span className="font-mono text-[9px] uppercase px-1.5 py-0.2 rounded bg-pink/20 text-pink border border-pink/30">
                Hidden
              </span>
            )}
          </div>
          <p className="font-mono text-xs text-muted-foreground truncate">{member.role}</p>
          {(member.department || member.year_batch) && (
            <p className="font-mono text-[10px] text-muted-foreground/70 truncate">
              {[member.department, member.year_batch].filter(Boolean).join(' • ')}
            </p>
          )}
          {(() => {
            const activeTags: string[] = []
            if (member.instagram_url || member.social_instagram) activeTags.push('IG')
            if (member.linkedin_url || member.social_linkedin) activeTags.push('LI')
            if (member.github_url || member.social_github) activeTags.push('GH')
            if (member.x_url || member.social_x) activeTags.push('X')
            if (member.portfolio_url || member.social_portfolio) activeTags.push('WEB')
            if (member.social_email) activeTags.push('EMAIL')
            return (
              <p className="font-mono text-[10px] mt-1 truncate">
                {activeTags.length > 0 ? (
                  <span className="text-cyan/90">Card socials: {activeTags.join(' · ')}</span>
                ) : (
                  <span className="text-muted-foreground/50">No card social links</span>
                )}
              </p>
            )
          })()}
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

type SocialFieldPlatform = 'instagram' | 'linkedin' | 'github' | 'x' | 'portfolio'

function normalizeSocialUrl(input: string, platform: SocialFieldPlatform): { url: string | null; error?: string } {
  const trimmed = input.trim()
  if (!trimmed) return { url: null }

  const lower = trimmed.toLowerCase()
  if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
    return { url: null, error: `Invalid ${platform} URL: script and unsafe schemes are rejected.` }
  }

  // Scheme present?
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    if (!lower.startsWith('https://')) {
      return { url: null, error: `Only HTTPS URLs are permitted for ${platform} (e.g. https://${platform === 'portfolio' ? 'example.com' : `${platform}.com/...`}).` }
    }
    return { url: trimmed }
  }

  // Raw handle, domain, or relative path
  const handle = trimmed.replace(/^@+/, '').trim()
  if (!handle) return { url: null }

  const clean = handle.replace(/^\/+|\/+$/g, '')
  if (platform === 'instagram') {
    if (/^(www\.)?instagram\.com\//i.test(clean)) return { url: `https://${clean}` }
    return { url: `https://instagram.com/${clean}` }
  }
  if (platform === 'linkedin') {
    if (/^(www\.)?linkedin\.com\//i.test(clean)) return { url: `https://${clean}` }
    const path = clean.startsWith('in/') ? clean : (clean.includes('/') ? clean : `in/${clean}`)
    return { url: `https://linkedin.com/${path}` }
  }
  if (platform === 'github') {
    if (/^(www\.)?github\.com\//i.test(clean)) return { url: `https://${clean}` }
    return { url: `https://github.com/${clean}` }
  }
  if (platform === 'x') {
    if (/^(www\.)?(x|twitter)\.com\//i.test(clean)) return { url: `https://${clean}` }
    return { url: `https://x.com/${clean}` }
  }
  return { url: `https://${clean}` }
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
    setForm({
      ...EMPTY_FORM,
      sort_order: (members[members.length - 1]?.sort_order ?? 0) + 1,
    })
    setPortraitFile(null)
    setSheetOpen(true)
  }

  function openEdit(member: PanelMember) {
    setEditing(member)
    setForm({
      name: member.name ?? '',
      role: member.role ?? '',
      accent: member.accent ?? 'cyan',
      sort_order: member.sort_order ?? 0,
      department: member.department ?? '',
      year_batch: member.year_batch ?? '',
      bio: member.bio ?? '',
      quote: member.quote ?? '',
      skills: Array.isArray(member.skills) ? member.skills.join(', ') : '',
      achievements: Array.isArray(member.achievements) ? member.achievements.join('\n') : '',
      fun_fact: member.fun_fact ?? '',
      joined_date: member.joined_date ?? '',
      social_instagram: member.social_instagram ?? '',
      social_linkedin: member.social_linkedin ?? '',
      instagram_url: member.instagram_url ?? member.social_instagram ?? '',
      linkedin_url: member.linkedin_url ?? member.social_linkedin ?? '',
      github_url: member.github_url ?? member.social_github ?? '',
      x_url: member.x_url ?? member.social_x ?? '',
      portfolio_url: member.portfolio_url ?? member.social_portfolio ?? '',
      social_github: member.social_github ?? member.github_url ?? '',
      social_x: member.social_x ?? member.x_url ?? '',
      social_email: member.social_email ?? '',
      social_portfolio: member.social_portfolio ?? member.portfolio_url ?? '',
      social_visibility: {
        instagram: member.social_visibility?.instagram ?? true,
        linkedin: member.social_visibility?.linkedin ?? true,
        github: member.social_visibility?.github ?? true,
        x: member.social_visibility?.x ?? true,
        portfolio: member.social_visibility?.portfolio ?? true,
        email: member.social_visibility?.email ?? true,
      },
      social_custom_label: member.social_custom_label ?? '',
      social_custom_url: member.social_custom_url ?? '',
      focal_point: member.focal_point || '50% 50%',
      accent_color_hex: member.accent_color_hex || '#00ffff',
      hidden: member.hidden ?? false,
      member_code: member.member_code ?? `GZ-${String(Math.max(1, member.sort_order || 1)).padStart(3, '0')}`,
      card_overrides_finish: (member.card_overrides?.finish as string) ?? '',
      card_overrides_orientation: (member.card_overrides?.orientation as string) ?? '',
      card_overrides_strapColor: (member.card_overrides?.strapColor as string) ?? '',
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
        const result = await uploadImage(portraitFile, 'panel', 800, 1)
        portrait_url = result.url
        portrait_path = result.path
      }

      const skillsArray = form.skills
        ? form.skills.split(',').map((s) => s.trim()).filter(Boolean)
        : []

      const achievementsArray = form.achievements
        ? form.achievements.split('\n').map((a) => a.trim()).filter(Boolean)
        : []

      const card_overrides: Record<string, any> = {}
      if (form.card_overrides_finish) card_overrides.finish = form.card_overrides_finish
      if (form.card_overrides_orientation) card_overrides.orientation = form.card_overrides_orientation
      if (form.card_overrides_strapColor) card_overrides.strapColor = form.card_overrides_strapColor

      // Normalize and validate social links (HTTPS only)
      const igResult = normalizeSocialUrl(form.instagram_url, 'instagram')
      if (igResult.error) { toast.error(igResult.error); setSaving(false); return }

      const liResult = normalizeSocialUrl(form.linkedin_url, 'linkedin')
      if (liResult.error) { toast.error(liResult.error); setSaving(false); return }

      const ghResult = normalizeSocialUrl(form.github_url, 'github')
      if (ghResult.error) { toast.error(ghResult.error); setSaving(false); return }

      const xResult = normalizeSocialUrl(form.x_url, 'x')
      if (xResult.error) { toast.error(xResult.error); setSaving(false); return }

      const pfResult = normalizeSocialUrl(form.portfolio_url, 'portfolio')
      if (pfResult.error) { toast.error(pfResult.error); setSaving(false); return }

      // Badge ID is strictly derived from member sort_order (padded to 3 digits)
      const memberCode = `GZ-${String(Math.max(1, form.sort_order || 1)).padStart(3, '0')}`

      const payload: Record<string, any> = {
        name: form.name.trim(),
        role: form.role.trim(),
        accent: form.accent,
        sort_order: form.sort_order,
        department: form.department.trim() || null,
        year_batch: form.year_batch.trim() || null,
        bio: form.bio.trim() || null,
        quote: form.quote.trim() || null,
        skills: skillsArray,
        achievements: achievementsArray,
        fun_fact: form.fun_fact.trim() || null,
        joined_date: form.joined_date || null,
        social_instagram: igResult.url,
        social_linkedin: liResult.url,
        instagram_url: igResult.url || '',
        linkedin_url: liResult.url || '',
        github_url: ghResult.url || '',
        x_url: xResult.url || '',
        portfolio_url: pfResult.url || '',
        social_github: ghResult.url,
        social_x: xResult.url,
        social_email: form.social_email.trim() || null,
        social_portfolio: pfResult.url,
        social_visibility: form.social_visibility,
        social_custom_label: form.social_custom_label.trim() || null,
        social_custom_url: form.social_custom_url.trim() || null,
        focal_point: form.focal_point.trim() || '50% 50%',
        accent_color_hex: form.accent_color_hex.trim() || null,
        hidden: form.hidden,
        member_code: memberCode,
        card_overrides: Object.keys(card_overrides).length > 0 ? card_overrides : null,
        portrait_url,
        portrait_path,
      }

      let saveError: any = null
      const stripExtendedCols = (src: Record<string, any>) => {
        const copy = { ...src }
        delete copy.instagram_url
        delete copy.linkedin_url
        delete copy.github_url
        delete copy.x_url
        delete copy.portfolio_url
        delete copy.social_visibility
        return copy
      }
      if (editing) {
        const { error } = await supabase.from('panel_members').update(payload).eq('id', editing.id)
        if (error) {
          if (
            error.message?.includes('instagram_url') ||
            error.message?.includes('linkedin_url') ||
            error.message?.includes('github_url') ||
            error.message?.includes('social_visibility')
          ) {
            const retry = await supabase.from('panel_members').update(stripExtendedCols(payload)).eq('id', editing.id)
            if (retry.error) saveError = retry.error
          } else {
            saveError = error
          }
        }
      } else {
        const { error } = await supabase.from('panel_members').insert(payload)
        if (error) {
          if (
            error.message?.includes('instagram_url') ||
            error.message?.includes('linkedin_url') ||
            error.message?.includes('github_url') ||
            error.message?.includes('social_visibility')
          ) {
            const retry = await supabase.from('panel_members').insert(stripExtendedCols(payload))
            if (retry.error) saveError = retry.error
          } else {
            saveError = error
          }
        }
      }

      if (saveError) throw saveError
      toast.success(editing ? 'Member updated.' : 'Member added.')

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
            Manage club leadership, bios, skills, achievements &amp; social profiles.
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
          <div className="w-full max-w-xl bg-sidebar border-l border-border flex flex-col h-full shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-sidebar z-10">
              <div>
                <h2 className="font-display text-xl font-bold text-white">
                  {editing ? 'Edit Member' : 'New Member'}
                </h2>
                <p className="font-mono text-xs text-muted-foreground mt-0.5">
                  Member details, bio, skills, achievements &amp; social profiles
                </p>
              </div>
              <button onClick={closeSheet} className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-border/40 transition-all">
                <X size={18} />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">

              {/* SECTION: BASIC IDENTITY */}
              <div className="space-y-4">
                <h3 className="font-mono text-xs font-bold text-yellow uppercase tracking-wider border-b border-border/60 pb-2">
                  Identity
                </h3>

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
                    placeholder="e.g. President, Technical Lead, Designer"
                  />
                </div>

                {/* Team / Department + Year/Batch */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                      Team / Department
                    </label>
                    <select
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                    >
                      <option value="">-- Select Team --</option>
                      <option value="Faculty">Faculty</option>
                      <option value="Technical Team">Technical Team</option>
                      <option value="Event Management Team">Event Management Team</option>
                      <option value="Social Media Team">Social Media Team</option>
                      <option value="Design Team">Design Team</option>
                      <option value="Finance Team">Finance Team</option>
                      <option value="Outreach Team">Outreach Team</option>
                      <option value="Cultural Team">Cultural Team</option>
                      <option value="Decor Team">Decor Team</option>
                      <option value="Photography Team">Photography Team</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                      Year / Batch
                    </label>
                    <input
                      type="text"
                      value={form.year_batch}
                      onChange={(e) => setForm({ ...form, year_batch: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                      placeholder="e.g. 2024-25 or 3rd Year"
                    />
                  </div>
                </div>

                {/* Accent + Sort Order */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                      Accent Theme
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

                {/* Hide Member toggle */}
                <div className="flex items-center justify-between bg-background border border-border rounded-lg px-4 py-3">
                  <div>
                    <p className="font-mono text-xs text-white">Hide Member</p>
                    <p className="font-mono text-[10px] text-muted-foreground">Keep in database but hide on website</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, hidden: !form.hidden })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.hidden ? 'bg-pink' : 'bg-border'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.hidden ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
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

                {/* Focal Point */}
                <div>
                  <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                    Portrait Focal Point (crop position)
                  </label>
                  <input
                    type="text"
                    value={form.focal_point}
                    onChange={(e) => setForm({ ...form, focal_point: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                    placeholder="50% 50%"
                  />
                  <p className="font-mono text-[10px] text-muted-foreground mt-1">
                    e.g. &apos;50% 20%&apos; or &apos;30% 50%&apos; — controls CSS object-position for photo crop
                  </p>
                </div>

                {/* Custom Accent Color Hex */}
                <div>
                  <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                    Accent Color Hex (optional override)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.accent_color_hex.startsWith('#') ? form.accent_color_hex : '#00ffff'}
                      onChange={(e) => setForm({ ...form, accent_color_hex: e.target.value })}
                      className="w-10 h-10 rounded-lg border border-border bg-transparent cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={form.accent_color_hex}
                      onChange={(e) => setForm({ ...form, accent_color_hex: e.target.value })}
                      className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-cyan"
                      placeholder="#00ffff"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: BIO & QUOTE */}
              <div className="space-y-4 pt-4">
                <h3 className="font-mono text-xs font-bold text-yellow uppercase tracking-wider border-b border-border/60 pb-2">
                  Bio &amp; Quote
                </h3>

                {/* Bio */}
                <div>
                  <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                    Bio / Introduction
                  </label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    rows={3}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                    placeholder="Tell the community about this team member…"
                  />
                </div>

                {/* Quote */}
                <div>
                  <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                    Favorite Quote / Motto
                  </label>
                  <input
                    type="text"
                    value={form.quote}
                    onChange={(e) => setForm({ ...form, quote: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                    placeholder="e.g. Build things that break reality."
                  />
                </div>

                {/* Fun Fact */}
                <div>
                  <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                    Fun Fact
                  </label>
                  <input
                    type="text"
                    value={form.fun_fact}
                    onChange={(e) => setForm({ ...form, fun_fact: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                    placeholder="e.g. Has written code while on a moving train in 3 countries."
                  />
                </div>

                {/* Joined Date */}
                <div>
                  <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                    Joined Date
                  </label>
                  <input
                    type="date"
                    value={form.joined_date}
                    onChange={(e) => setForm({ ...form, joined_date: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                  />
                </div>
              </div>

              {/* SECTION: SKILLS & ACHIEVEMENTS */}
              <div className="space-y-4 pt-4">
                <h3 className="font-mono text-xs font-bold text-yellow uppercase tracking-wider border-b border-border/60 pb-2">
                  Skills &amp; Achievements
                </h3>

                {/* Skills */}
                <div>
                  <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                    Skills (comma-separated chips)
                  </label>
                  <input
                    type="text"
                    value={form.skills}
                    onChange={(e) => setForm({ ...form, skills: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                    placeholder="UI/UX, React, Blender, Sound Design, Rust"
                  />
                </div>

                {/* Achievements */}
                <div>
                  <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                    Achievements (one per line)
                  </label>
                  <textarea
                    value={form.achievements}
                    onChange={(e) => setForm({ ...form, achievements: e.target.value })}
                    rows={3}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                    placeholder="Won 1st place in National Hackathon 2024&#10;Organized TechFest for 2000+ attendees&#10;Published research paper on Generative UI"
                  />
                </div>
              </div>

              {/* SECTION: SOCIAL PROFILES */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <h3 className="font-mono text-xs font-bold text-yellow uppercase tracking-wider">
                    Social Profiles
                  </h3>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    Accepts @handle or full https:// URL
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Instagram (Primary) */}
                  <div className="p-3 rounded-xl border border-pink/30 bg-pink/5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label className="font-mono text-[10px] text-pink font-bold uppercase tracking-widest">
                        Instagram (Main Action)
                      </label>
                      <label className="flex items-center gap-1.5 font-mono text-[10px] text-white/75 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={form.social_visibility.instagram !== false}
                          onChange={(e) => setForm({ ...form, social_visibility: { ...form.social_visibility, instagram: e.target.checked } })}
                          className="accent-pink h-3.5 w-3.5 rounded"
                        />
                        Show on card
                      </label>
                    </div>
                    <input
                      type="text"
                      value={form.instagram_url}
                      onChange={(e) => setForm({ ...form, instagram_url: e.target.value })}
                      className="w-full bg-background border border-pink/40 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pink/50 focus:border-pink transition-all"
                      placeholder="@handle or https://instagram.com/..."
                    />
                    <p className="font-mono text-[10px] text-muted-foreground/75 leading-tight">
                      Normalizes @handle or name to https://instagram.com/... (HTTPS only).
                    </p>
                  </div>

                  {/* LinkedIn (Secondary) */}
                  <div className="p-3 rounded-xl border border-cyan/30 bg-cyan/5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label className="font-mono text-[10px] text-cyan font-bold uppercase tracking-widest">
                        LinkedIn Profile
                      </label>
                      <label className="flex items-center gap-1.5 font-mono text-[10px] text-white/75 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={form.social_visibility.linkedin !== false}
                          onChange={(e) => setForm({ ...form, social_visibility: { ...form.social_visibility, linkedin: e.target.checked } })}
                          className="accent-cyan h-3.5 w-3.5 rounded"
                        />
                        Show on card
                      </label>
                    </div>
                    <input
                      type="text"
                      value={form.linkedin_url}
                      onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
                      className="w-full bg-background border border-cyan/40 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                      placeholder="@handle or https://linkedin.com/in/..."
                    />
                    <p className="font-mono text-[10px] text-muted-foreground/75 leading-tight">
                      Normalizes @handle or name to https://linkedin.com/in/... (HTTPS only).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                        GitHub
                      </label>
                      <label className="flex items-center gap-1.5 font-mono text-[10px] text-white/65 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={form.social_visibility.github !== false}
                          onChange={(e) => setForm({ ...form, social_visibility: { ...form.social_visibility, github: e.target.checked } })}
                          className="accent-cyan h-3 w-3 rounded"
                        />
                        Show
                      </label>
                    </div>
                    <input
                      type="text"
                      value={form.github_url}
                      onChange={(e) => setForm({ ...form, github_url: e.target.value, social_github: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-cyan"
                      placeholder="@username or https://github.com/..."
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                        X (Twitter)
                      </label>
                      <label className="flex items-center gap-1.5 font-mono text-[10px] text-white/65 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={form.social_visibility.x !== false}
                          onChange={(e) => setForm({ ...form, social_visibility: { ...form.social_visibility, x: e.target.checked } })}
                          className="accent-cyan h-3 w-3 rounded"
                        />
                        Show
                      </label>
                    </div>
                    <input
                      type="text"
                      value={form.x_url}
                      onChange={(e) => setForm({ ...form, x_url: e.target.value, social_x: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-cyan"
                      placeholder="@handle or https://x.com/..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                        Email Address
                      </label>
                      <label className="flex items-center gap-1.5 font-mono text-[10px] text-white/65 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={form.social_visibility.email !== false}
                          onChange={(e) => setForm({ ...form, social_visibility: { ...form.social_visibility, email: e.target.checked } })}
                          className="accent-cyan h-3 w-3 rounded"
                        />
                        Show
                      </label>
                    </div>
                    <input
                      type="email"
                      value={form.social_email}
                      onChange={(e) => setForm({ ...form, social_email: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-cyan"
                      placeholder="name@example.com"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                        Portfolio / Website
                      </label>
                      <label className="flex items-center gap-1.5 font-mono text-[10px] text-white/65 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={form.social_visibility.portfolio !== false}
                          onChange={(e) => setForm({ ...form, social_visibility: { ...form.social_visibility, portfolio: e.target.checked } })}
                          className="accent-cyan h-3 w-3 rounded"
                        />
                        Show
                      </label>
                    </div>
                    <input
                      type="text"
                      value={form.portfolio_url}
                      onChange={(e) => setForm({ ...form, portfolio_url: e.target.value, social_portfolio: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-cyan"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {/* Preview social buttons on 3D ID card */}
                <div className="rounded-xl border border-border bg-background/60 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Preview social links on card
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground/70">
                      Empty links are hidden on 3D cards
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {form.instagram_url.trim() && form.social_visibility.instagram !== false && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] px-3 py-1 font-mono text-xs font-bold text-white shadow">
                        IG @{form.instagram_url.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/[/?#].*$/, '').replace(/^@+/, '')}
                      </span>
                    )}
                    {form.linkedin_url.trim() && form.social_visibility.linkedin !== false && (
                      <span className="inline-flex items-center justify-center rounded-lg bg-[#0a66c2] px-2.5 py-1 font-mono text-xs font-bold text-white shadow">
                        in
                      </span>
                    )}
                    {form.github_url.trim() && form.social_visibility.github !== false && (
                      <span className="inline-flex items-center justify-center rounded-lg bg-[#24292e] px-2.5 py-1 font-mono text-xs font-bold text-white border border-white/15">
                        GH
                      </span>
                    )}
                    {form.x_url.trim() && form.social_visibility.x !== false && (
                      <span className="inline-flex items-center justify-center rounded-lg bg-[#141418] px-2.5 py-1 font-mono text-xs font-bold text-white border border-white/15">
                        X
                      </span>
                    )}
                    {form.portfolio_url.trim() && form.social_visibility.portfolio !== false && (
                      <span className="inline-flex items-center justify-center rounded-lg bg-[#0284c7] px-2.5 py-1 font-mono text-xs font-bold text-white">
                        WEB
                      </span>
                    )}
                    {form.social_email.trim() && form.social_visibility.email !== false && (
                      <span className="inline-flex items-center justify-center rounded-lg bg-[#d97706] px-2.5 py-1 font-mono text-xs font-bold text-white">
                        MAIL
                      </span>
                    )}
                    {!(
                      (form.instagram_url.trim() && form.social_visibility.instagram !== false) ||
                      (form.linkedin_url.trim() && form.social_visibility.linkedin !== false) ||
                      (form.github_url.trim() && form.social_visibility.github !== false) ||
                      (form.x_url.trim() && form.social_visibility.x !== false) ||
                      (form.portfolio_url.trim() && form.social_visibility.portfolio !== false) ||
                      (form.social_email.trim() && form.social_visibility.email !== false)
                    ) && (
                      <span className="font-mono text-xs text-yellow/80">
                        No active social links yet — enter Instagram or LinkedIn above so the logos appear on this member&apos;s 3D card.
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                      Custom Link Label
                    </label>
                    <input
                      type="text"
                      value={form.social_custom_label}
                      onChange={(e) => setForm({ ...form, social_custom_label: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-cyan"
                      placeholder="Behance / Medium"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                      Custom Link URL
                    </label>
                    <input
                      type="text"
                      value={form.social_custom_url}
                      onChange={(e) => setForm({ ...form, social_custom_url: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-cyan"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {/* 3D ID Card Overrides */}
                <div className="pt-4 border-t border-border">
                  <h3 className="font-mono text-xs text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <CreditCard size={14} className="text-cyan" />
                    3D ID Card Overrides
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                          Member Badge ID
                        </label>
                        <span className="font-mono text-[10px] text-cyan">
                          Auto-generated
                        </span>
                      </div>
                      <div className="w-full bg-background/50 border border-border rounded-lg px-3 py-2.5 text-cyan font-mono text-sm flex items-center justify-between">
                        <span className="font-bold tracking-wider">
                          {`GZ-${String(Math.max(1, form.sort_order || 1)).padStart(3, '0')}`}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Derived from sort order #{form.sort_order || 1}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                          Card Finish Override
                        </label>
                        <select
                          value={form.card_overrides_finish}
                          onChange={(e) => setForm({ ...form, card_overrides_finish: e.target.value })}
                          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-cyan"
                        >
                          <option value="">Global Default</option>
                          <option value="glossy">Glossy</option>
                          <option value="matte">Matte</option>
                          <option value="holographic">Holographic</option>
                          <option value="metallic">Metallic</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                          Orientation Override
                        </label>
                        <select
                          value={form.card_overrides_orientation}
                          onChange={(e) => setForm({ ...form, card_overrides_orientation: e.target.value })}
                          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-cyan"
                        >
                          <option value="">Global Default</option>
                          <option value="portrait">Portrait</option>
                          <option value="landscape">Landscape</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                        Custom Strap Color (hex)
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={form.card_overrides_strapColor || '#00f0ff'}
                          onChange={(e) => setForm({ ...form, card_overrides_strapColor: e.target.value })}
                          className="w-10 h-10 rounded border border-border bg-background cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={form.card_overrides_strapColor}
                          onChange={(e) => setForm({ ...form, card_overrides_strapColor: e.target.value })}
                          className="flex-1 bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-cyan"
                          placeholder="#00f0ff (leave empty for global default)"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
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
