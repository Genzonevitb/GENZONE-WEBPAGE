import imageCompression from 'browser-image-compression'
import { supabase } from '@/lib/supabase'

export type UploadResult = {
  url: string
  path: string
}

/**
 * Compresses and uploads an image to a Supabase Storage bucket.
 *
 * @param file            Raw File selected by the user.
 * @param bucket          Bucket name: 'panel' | 'gallery' | 'events'
 * @param maxWidthOrHeight Max width/height in px after compression.
 * @param maxSizeMB       Max file size in MB after compression.
 */
export async function uploadImage(
  file: File,
  bucket: string,
  maxWidthOrHeight: number = 1920,
  maxSizeMB: number = 1,
): Promise<UploadResult> {
  // 1. Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error(`Invalid file type "${file.type}". Only images are accepted.`)
  }

  // 2. Compress to WebP
  let compressedFile: File
  try {
    compressedFile = await imageCompression(file, {
      maxWidthOrHeight,
      maxSizeMB,
      useWebWorker: true,
      fileType: 'image/webp',
    })
  } catch (err) {
    throw new Error(
      `Image compression failed: ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  // 3. Unique filename: timestamp + uuid to prevent any collision
  const timestamp = Date.now()
  const uid = crypto.randomUUID().split('-')[0]
  const filename = `${timestamp}-${uid}.webp`

  // 4. Upload
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filename, compressedFile, {
      contentType: 'image/webp',
      cacheControl: '31536000', // 1 year cache
      upsert: false,
    })

  if (error) {
    // Surface the exact Supabase error (e.g. "Bucket not found", "RLS violation")
    throw new Error(`Upload to "${bucket}" failed: ${error.message}`)
  }

  // 5. Get public URL
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)

  if (!urlData?.publicUrl) {
    throw new Error('Uploaded successfully but could not retrieve public URL.')
  }

  return {
    url: urlData.publicUrl,
    path: data.path,
  }
}
