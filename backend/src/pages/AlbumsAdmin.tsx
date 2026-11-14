import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Plus, Trash2, Save, Upload, Images } from 'lucide-react'
import { uploadImage } from '@/lib/uploadImage'
import ImageDropzone from '@/components/ImageDropzone'

interface Album {
  id: string
  name: string
  heading: string | null
  sort_order: number
}

interface Photo {
  id: string
  caption: string | null
  category: string | null
  album_id: string | null
  image_url: string
  thumb_url: string | null
  tall: boolean
}

export default function AlbumsAdmin() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)

  // Create album
  const [newAlbumName, setNewAlbumName] = useState('')
  const [newAlbumHeading, setNewAlbumHeading] = useState('')
  const [creatingAlbum, setCreatingAlbum] = useState(false)

  // Active album for editing / photo upload
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null)
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null)
  const [savingAlbum, setSavingAlbum] = useState(false)
  const [deletingAlbumId, setDeletingAlbumId] = useState<string | null>(null)

  // Photo upload
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoCaption, setPhotoCaption] = useState('')
  const [photoCategory, setPhotoCategory] = useState('')
  const [photoTall, setPhotoTall] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // Photo delete / move
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [albumsRes, photosRes] = await Promise.all([
      supabase.from('gallery_albums').select('id, name, heading, sort_order').order('sort_order'),
      supabase.from('gallery').select('id, caption, category, album_id, image_url, thumb_url, tall').order('sort_order', { ascending: true }),
    ])
    if (albumsRes.data) setAlbums(albumsRes.data as Album[])
    if (photosRes.data) setPhotos(photosRes.data as Photo[])
    setLoading(false)
  }

  async function createAlbum() {
    const name = newAlbumName.trim()
    if (!name) { toast.error('Album name cannot be empty.'); return }
    setCreatingAlbum(true)
    const nextOrder = albums.length > 0 ? Math.max(...albums.map((a) => a.sort_order)) + 1 : 1
    const { error } = await supabase.from('gallery_albums').insert([{
      name,
      heading: newAlbumHeading.trim() || null,
      sort_order: nextOrder,
    }])
    if (error) {
      toast.error('Failed to create album: ' + error.message)
    } else {
      toast.success(`Album "${name}" created!`)
      setNewAlbumName('')
      setNewAlbumHeading('')
      fetchAll()
    }
    setCreatingAlbum(false)
  }

  async function saveAlbum() {
    if (!editingAlbum) return
    setSavingAlbum(true)
    const { error } = await supabase.from('gallery_albums')
      .update({ name: editingAlbum.name, heading: editingAlbum.heading })
      .eq('id', editingAlbum.id)
    if (error) {
      toast.error('Failed to save album: ' + error.message)
    } else {
      toast.success('Album saved!')
      fetchAll()
    }
    setSavingAlbum(false)
  }

  async function deleteAlbum(id: string) {
    if (!confirm('Delete this album? Photos in it will move to "unassigned" (still visible under All).')) return
    setDeletingAlbumId(id)
    const { error } = await supabase.from('gallery_albums').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete album.')
    } else {
      toast.success('Album deleted. Photos kept under All.')
      setActiveAlbumId(null)
      setEditingAlbum(null)
      fetchAll()
    }
    setDeletingAlbumId(null)
  }

  async function moveAlbum(id: string, direction: 'up' | 'down') {
    const idx = albums.findIndex((a) => a.id === id)
    if (idx === -1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= albums.length) return
    const a = albums[idx]
    const b = albums[swapIdx]
    await Promise.all([
      supabase.from('gallery_albums').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('gallery_albums').update({ sort_order: a.sort_order }).eq('id', b.id),
    ])
    fetchAll()
  }

  async function uploadPhoto() {
    if (!photoFile) { toast.error('Please select a photo first.'); return }
    setUploadingPhoto(true)
    try {
      const { url } = await uploadImage(photoFile, 'gallery', 1920, 1)
      const nextOrder = photos.length > 0 ? Math.max(...photos.map((p) => p.id ? 0 : 0)) + photos.length : 0
      const { error } = await supabase.from('gallery').insert([{
        image_url: url,
        thumb_url: null,
        caption: photoCaption.trim() || null,
        category: photoCategory.trim() || null,
        album_id: activeAlbumId || null,
        tall: photoTall,
        sort_order: nextOrder,
      }])
      if (error) throw error
      toast.success('Photo uploaded!')
      setPhotoFile(null)
      setPhotoCaption('')
      setPhotoCategory('')
      setPhotoTall(false)
      fetchAll()
    } catch (err: any) {
      toast.error(err?.message ?? 'Upload failed.')
    }
    setUploadingPhoto(false)
  }

  async function deletePhoto(id: string) {
    if (!confirm('Delete this photo permanently?')) return
    setDeletingPhotoId(id)
    const { error } = await supabase.from('gallery').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete photo.')
    } else {
      toast.success('Photo deleted.')
      setPhotos((prev) => prev.filter((p) => p.id !== id))
    }
    setDeletingPhotoId(null)
  }

  async function movePhotoToAlbum(photoId: string, albumId: string | null) {
    const { error } = await supabase.from('gallery').update({ album_id: albumId }).eq('id', photoId)
    if (error) {
      toast.error('Failed to move photo.')
    } else {
      toast.success('Photo moved!')
      fetchAll()
    }
  }

  const activeAlbumPhotos = activeAlbumId
    ? photos.filter((p) => p.album_id === activeAlbumId)
    : photos

  if (loading) return (
    <div className="p-6 md:p-10">
      <div className="animate-pulse space-y-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 bg-charcoal rounded-lg" />)}
      </div>
    </div>
  )

  return (
    <div className="p-6 md:p-10">
      <div className="mb-10">
        <p className="font-mono text-xs text-cyan tracking-[0.3em] uppercase mb-2">09 — Albums</p>
        <h1 className="font-display text-3xl font-black uppercase">Gallery Albums</h1>
        <p className="text-muted-foreground text-sm mt-2">Create albums, upload photos into them, and manage existing photos.</p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[300px_1fr]">
        {/* ── Left: Albums list ── */}
        <div className="space-y-6">
          <section>
            <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-4 pb-2 border-b border-border">
              Albums ({albums.length})
            </h2>
            <div className="space-y-2">
              {/* All photos button */}
              <button
                type="button"
                onClick={() => { setActiveAlbumId(null); setEditingAlbum(null) }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-mono text-xs transition-all border ${activeAlbumId === null ? 'border-pink bg-pink/10 text-pink' : 'border-border text-muted-foreground hover:text-white hover:border-cyan'}`}
              >
                <Images size={14} />
                All Photos ({photos.length})
              </button>
              {albums.map((album, i) => (
                <button
                  key={album.id}
                  type="button"
                  onClick={() => { setActiveAlbumId(album.id); setEditingAlbum({ ...album }) }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-mono text-xs transition-all border text-left ${activeAlbumId === album.id ? 'border-cyan bg-cyan/10 text-cyan' : 'border-border text-muted-foreground hover:text-white hover:border-cyan'}`}
                >
                  <span className="flex-1 truncate">{album.name}</span>
                  <span className="text-muted-foreground/60">({photos.filter((p) => p.album_id === album.id).length})</span>
                  <div className="flex gap-0.5 ml-1">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); moveAlbum(album.id, 'up') }}
                      disabled={i === 0}
                      className="hover:text-cyan disabled:opacity-30 px-1"
                    >↑</button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); moveAlbum(album.id, 'down') }}
                      disabled={i === albums.length - 1}
                      className="hover:text-cyan disabled:opacity-30 px-1"
                    >↓</button>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Create new album */}
          <section>
            <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-4 pb-2 border-b border-border">
              New Album
            </h2>
            <div className="space-y-3">
              <input
                type="text"
                value={newAlbumName}
                onChange={(e) => setNewAlbumName(e.target.value)}
                placeholder="Album name (e.g. Hackathon 2025)"
                className="w-full bg-charcoal border border-border rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-yellow/50 focus:border-yellow transition-all"
              />
              <input
                type="text"
                value={newAlbumHeading}
                onChange={(e) => setNewAlbumHeading(e.target.value)}
                placeholder="Heading (optional)"
                className="w-full bg-charcoal border border-border rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-yellow/50 focus:border-yellow transition-all"
              />
              <button
                type="button"
                onClick={createAlbum}
                disabled={creatingAlbum || !newAlbumName.trim()}
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-semibold uppercase tracking-widest border border-yellow text-yellow hover:bg-yellow/10 disabled:opacity-40 transition-all"
              >
                <Plus size={14} />
                {creatingAlbum ? 'Creating…' : 'Create Album'}
              </button>
            </div>
          </section>
        </div>

        {/* ── Right: Album detail + photos ── */}
        <div className="space-y-8">
          {/* Edit active album */}
          {editingAlbum && (
            <section className="bg-charcoal border border-border rounded-xl p-6">
              <h2 className="font-mono text-xs text-cyan uppercase tracking-widest mb-4">
                Edit: {editingAlbum.name}
              </h2>
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2">Album Name</label>
                  <input
                    type="text"
                    value={editingAlbum.name}
                    onChange={(e) => setEditingAlbum((p) => p ? { ...p, name: e.target.value } : p)}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2">Album Heading</label>
                  <input
                    type="text"
                    value={editingAlbum.heading ?? ''}
                    onChange={(e) => setEditingAlbum((p) => p ? { ...p, heading: e.target.value } : p)}
                    placeholder="e.g. Best shots from the hackathon"
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={saveAlbum}
                  disabled={savingAlbum}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-semibold uppercase tracking-widest bg-cyan text-background hover:bg-cyan/90 disabled:opacity-40 transition-all"
                >
                  <Save size={14} />
                  {savingAlbum ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => deleteAlbum(editingAlbum.id)}
                  disabled={deletingAlbumId === editingAlbum.id}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-semibold uppercase tracking-widest border border-pink text-pink hover:bg-pink/10 disabled:opacity-40 transition-all"
                >
                  <Trash2 size={14} />
                  Delete Album
                </button>
              </div>
            </section>
          )}

          {/* Upload photo */}
          <section className="bg-charcoal border border-border rounded-xl p-6">
            <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-4">
              Upload Photo {activeAlbumId ? `→ ${albums.find((a) => a.id === activeAlbumId)?.name}` : '(All / Unassigned)'}
            </h2>
            <div className="space-y-4">
              <ImageDropzone onFile={setPhotoFile} label="Drop photo here or click to browse" maxMB={15} />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  placeholder="Caption (optional)"
                  className="col-span-2 bg-background border border-border rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                />
                <input
                  type="text"
                  value={photoCategory}
                  onChange={(e) => setPhotoCategory(e.target.value)}
                  placeholder="Category tag (optional)"
                  className="bg-background border border-border rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                />
                <label className="flex items-center gap-3 px-4 py-3 bg-background border border-border rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={photoTall}
                    onChange={(e) => setPhotoTall(e.target.checked)}
                    className="accent-cyan"
                  />
                  <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">Tall (3:4 aspect)</span>
                </label>
              </div>
              <button
                type="button"
                onClick={uploadPhoto}
                disabled={uploadingPhoto || !photoFile}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-semibold uppercase tracking-widest bg-cyan text-background hover:bg-cyan/90 disabled:opacity-40 transition-all"
              >
                <Upload size={14} />
                {uploadingPhoto ? 'Uploading…' : 'Upload Photo'}
              </button>
            </div>
          </section>

          {/* Photos grid */}
          <section>
            <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-4 pb-2 border-b border-border">
              {activeAlbumId ? `Photos in ${albums.find((a) => a.id === activeAlbumId)?.name}` : 'All Photos'} ({activeAlbumPhotos.length})
            </h2>
            {activeAlbumPhotos.length === 0 ? (
              <p className="font-mono text-xs text-muted-foreground">No photos here yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {activeAlbumPhotos.map((photo) => (
                  <div key={photo.id} className="group relative rounded-lg overflow-hidden border border-border aspect-square bg-charcoal">
                    <img
                      src={photo.thumb_url ?? photo.image_url}
                      alt={photo.caption ?? ''}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 items-center justify-center p-2">
                      {photo.caption && (
                        <p className="font-mono text-[9px] uppercase tracking-widest text-cyan text-center truncate w-full">{photo.caption}</p>
                      )}
                      {/* Move to album */}
                      <select
                        value={photo.album_id ?? ''}
                        onChange={(e) => movePhotoToAlbum(photo.id, e.target.value || null)}
                        className="w-full bg-background border border-border rounded px-2 py-1 text-[10px] font-mono focus:outline-none focus:border-cyan"
                      >
                        <option value="">Unassigned</option>
                        {albums.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                      <button
                        type="button"
                        onClick={() => deletePhoto(photo.id)}
                        disabled={deletingPhotoId === photo.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded font-mono text-[10px] border border-pink text-pink hover:bg-pink/20 transition-colors disabled:opacity-40"
                      >
                        <Trash2 size={10} />
                        {deletingPhotoId === photo.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
