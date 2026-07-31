import { supabase } from './supabase'
import {
  buildStorageFilePath,
  getStorageUploadErrorMessage,
} from './storage'

export async function uploadSiteAsset(file, folderName) {
  if (!supabase) {
    throw new Error(
      'خدمة Supabase غير مفعلة. تحقق من متغيرات البيئة VITE_SUPABASE_URL و VITE_SUPABASE_PUBLISHABLE_KEY.'
    )
  }

  if (!file) {
    throw new Error('لم يتم اختيار صورة')
  }

  const filePath = buildStorageFilePath(folderName, file)

  const { error: uploadError } = await supabase.storage
    .from('site-assets')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    throw new Error(getStorageUploadErrorMessage(uploadError, 'site-assets'))
  }

  const { data: publicUrlData } = supabase.storage
    .from('site-assets')
    .getPublicUrl(filePath)

  if (!publicUrlData?.publicUrl) {
    throw new Error(
      'تعذر إنشاء رابط عام للصورة. تأكد أن bucket site-assets يسمح بالقراءة العامة.'
    )
  }

  return publicUrlData.publicUrl
}
