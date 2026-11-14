import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Save, Plus, Trash2, Upload } from 'lucide-react'
import { uploadImage } from '@/lib/uploadImage'
import ImageDropzone from '@/components/ImageDropzone'

type Setting = { key: string; value: string }

const KNOWN_LABELS: Record<string, string> = {
  // Brand
  club_name:      'Club Name',
  footer_tagline: 'Footer Tagline',
  // Contact
  contact_email:  'Contact Email',
  location:       'Campus Location',
  tagline:        'Club Tagline (meta)',
  // Socials
  instagram: 'Instagram URL',
  linkedin:  'LinkedIn URL',
  youtube:   'YouTube URL',
  twitter:   'X (Twitter) URL',
}

function SkeletonRow() {
  return (
    <div className="animate-pulse flex flex-col gap-2">
      <div className="h-3 w-28 bg-border rounded" />
      <div className="h-10 bg-charcoal rounded-lg" />
    </div>
  )
}

export default function Settings() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [changed, setChanged] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Logo upload state
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // New setting state
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => { fetchSettings() }, [])

  async function fetchSettings() {
    setLoading(true)
    const { data, error } = await supabase.from('settings').select('*').order('key')
    if (error) {
      toast.error('Failed to load settings.')
    } else {
      setSettings(data ?? [])
    }
    setLoading(false)
  }

  function handleChange(key: string, value: string) {
    setChanged((prev) => ({ ...prev, [key]: value }))
  }

  async function saveChanges() {
    if (Object.keys(changed).length === 0) {
      toast.info('No changes to save.')
      return
    }
    setSaving(true)
    const rows = Object.entries(changed).map(([key, value]) => ({ key, value }))
    const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' })
    if (error) {
      toast.error('Failed to save settings: ' + error.message)
    } else {
      toast.success('Settings saved!')
      setChanged({})
      fetchSettings()
    }
    setSaving(false)
  }

  async function uploadLogo() {
    if (!logoFile) return
    setUploadingLogo(true)
    try {
      const { url } = await uploadImage(logoFile, 'assets', 1200, 0.5)
      const { error } = await supabase.from('settings').upsert([{ key: 'logo_url', value: url }], { onConflict: 'key' })
      if (error) throw error
      toast.success('Logo uploaded and saved!')
      setLogoFile(null)
      fetchSettings()
    } catch (err: any) {
      toast.error(err?.message ?? 'Logo upload failed.')
    }
    setUploadingLogo(false)
  }

  async function addSetting() {
    const key = newKey.trim().toLowerCase().replace(/\s+/g, '_')
    const value = newValue.trim()
    if (!key) { toast.error('Key cannot be empty.'); return }
    if (settings.some((s) => s.key === key)) { toast.error(`Key "${key}" already exists. Edit it above.`); return }
    setAdding(true)
    const { error } = await supabase.from('settings').insert([{ key, value }])
    if (error) {
      toast.error('Failed to add setting: ' + error.message)
    } else {
      toast.success(`Setting "${key}" added.`)
      setNewKey(''); setNewValue('')
      fetchSettings()
    }
    setAdding(false)
  }

  async function deleteSetting(key: string) {
    const { error } = await supabase.from('settings').delete().eq('key', key)
    if (error) {
      toast.error('Failed to delete setting.')
    } else {
      toast.success(`"${key}" deleted.`)
      setSettings((prev) => prev.filter((s) => s.key !== key))
      setChanged((prev) => { const copy = { ...prev }; delete copy[key]; return copy })
    }
  }

  // Hidden keys managed via dedicated UI (logo_url, favicon_url) — don't show in text fields
  const hiddenKeys = ['logo_url', 'favicon_url']
  const knownKeys = Object.keys(KNOWN_LABELS)
  const knownSettings = knownKeys.map((k) => settings.find((s) => s.key === k) ?? { key: k, value: '' })
  const customSettings = settings.filter((s) => !knownKeys.includes(s.key) && !hiddenKeys.includes(s.key))

  const currentLogoUrl = settings.find((s) => s.key === 'logo_url')?.value || ''

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <p className="font-mono text-xs text-cyan tracking-[0.3em] uppercase mb-2">05 — Settings</p>
        <h1 className="font-display text-3xl font-black uppercase">Site Settings</h1>
        <p className="text-muted-foreground text-sm mt-2">
          Edit branding, contact info, social links, and other site-wide values.
        </p>
      </div>

      {loading ? (
        <div className="space-y-6">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : (
        <div className="space-y-10">

          {/* ── Logo Upload ── */}
          <section>
            <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-6 pb-2 border-b border-border">
              Logo
            </h2>
            <p className="font-mono text-xs text-muted-foreground mb-3">
              Upload a custom logo (white on transparent PNG/WebP works best with the glow effect).
              Leave empty to use the default logo.
            </p>
            <ImageDropzone
              onFile={setLogoFile}
              currentUrl={currentLogoUrl || undefined}
              label="Drop logo here or click to browse"
              maxMB={5}
            />
            {logoFile && (
              <button
                type="button"
                onClick={uploadLogo}
                disabled={uploadingLogo}
                className="mt-3 flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-semibold uppercase tracking-widest bg-cyan text-background hover:bg-cyan/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Upload size={14} />
                {uploadingLogo ? 'Uploading…' : 'Upload Logo'}
              </button>
            )}
            {currentLogoUrl && (
              <button
                type="button"
                onClick={async () => {
                  const { error } = await supabase.from('settings').upsert([{ key: 'logo_url', value: '' }], { onConflict: 'key' })
                  if (!error) { toast.success('Logo removed — using default.'); fetchSettings() }
                }}
                className="mt-2 ml-2 font-mono text-xs text-muted-foreground hover:text-pink transition-colors"
              >
                Remove custom logo
              </button>
            )}
          </section>

          {/* ── Known settings ── */}
          <section>
            <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-6 pb-2 border-b border-border">
              Club Information & Socials
            </h2>
            <div className="space-y-5">
              {knownSettings.map((s) => {
                const displayValue = changed[s.key] ?? s.value
                return (
                  <div key={s.key}>
                    <label className="block font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2">
                      {KNOWN_LABELS[s.key]}
                      <span className="ml-2 text-border normal-case">({s.key})</span>
                    </label>
                    <input
                      type="text"
                      value={displayValue}
                      onChange={(e) => handleChange(s.key, e.target.value)}
                      className="w-full bg-charcoal border border-border rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                      placeholder={`Enter ${KNOWN_LABELS[s.key] ?? s.key}…`}
                    />
                  </div>
                )
              })}
            </div>
          </section>

          {/* Custom settings */}
          {customSettings.length > 0 && (
            <section>
              <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-6 pb-2 border-b border-border">
                Custom Settings
              </h2>
              <div className="space-y-5">
                {customSettings.map((s) => {
                  const displayValue = changed[s.key] ?? s.value
                  return (
                    <div key={s.key}>
                      <div className="flex items-center justify-between mb-2">
                        <label className="font-mono text-xs text-muted-foreground uppercase tracking-widest">{s.key}</label>
                        <button
                          type="button"
                          onClick={() => deleteSetting(s.key)}
                          className="text-muted-foreground hover:text-pink transition-colors"
                          title="Delete setting"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={displayValue}
                        onChange={(e) => handleChange(s.key, e.target.value)}
                        className="w-full bg-charcoal border border-border rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                      />
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Save button */}
          <button
            type="button"
            onClick={saveChanges}
            disabled={saving || Object.keys(changed).length === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-mono text-sm font-semibold uppercase tracking-widest bg-cyan text-background hover:bg-cyan/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Save size={15} />
            {saving ? 'Saving…' : `Save Changes${Object.keys(changed).length > 0 ? ` (${Object.keys(changed).length})` : ''}`}
          </button>

          {/* Add new setting */}
          <section className="pt-4 border-t border-border">
            <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-6">
              Add New Setting
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2">Key</label>
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="e.g. whatsapp"
                  className="w-full bg-charcoal border border-border rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-yellow/50 focus:border-yellow transition-all"
                />
              </div>
              <div>
                <label className="block font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2">Value</label>
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="e.g. https://wa.me/..."
                  className="w-full bg-charcoal border border-border rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-yellow/50 focus:border-yellow transition-all"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={addSetting}
              disabled={adding || !newKey.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-semibold uppercase tracking-widest border border-yellow text-yellow hover:bg-yellow/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Plus size={14} />
              {adding ? 'Adding…' : 'Add Setting'}
            </button>
          </section>
        </div>
      )}
    </div>
  )
}
