import { supabase } from './supabase'

export async function uploadSiteAsset(file, folderName) {
  if (!file) {
    throw new Error('لم يتم اختيار صورة')
  }

  const fileExt = file.name.split('.').pop() || 'bin'
  const safeExt = fileExt.toLowerCase()
  const fileName = `${folderName}-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}.${safeExt}`
  const filePath = `${folderName}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('site-assets')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    const message = uploadError.message || 'فشل رفع الصورة إلى Supabase'
    throw new Error(`فشل رفع الصورة: ${message}`)
  }

  const { data: publicUrlData } = supabase.storage
    .from('site-assets')
    .getPublicUrl(filePath)

  return publicUrlData.publicUrl
}
