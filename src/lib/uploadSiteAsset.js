import { supabase } from './supabase'

export async function uploadSiteAsset(file, folderName) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${folderName}-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}.${fileExt}`
  const filePath = `${folderName}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('site-assets')
    .upload(filePath, file)

  if (uploadError) {
    throw uploadError
  }

  const { data: publicUrlData } = supabase.storage
    .from('site-assets')
    .getPublicUrl(filePath)

  return publicUrlData.publicUrl
}
