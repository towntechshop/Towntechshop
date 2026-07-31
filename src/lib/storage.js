export function getStorageUploadErrorMessage(error, bucketName) {
  const rawMessage = error?.message || ''
  const normalized = rawMessage.toLowerCase()

  if (normalized.includes('row-level security') || normalized.includes('policy')) {
    return `تعذر رفع الملف إلى bucket ${bucketName}. تأكد من أن bucket عام ومفتوح للكتابة من خلال سياسة Storage في Supabase.`
  }

  if (normalized.includes('bucket') && normalized.includes('not found')) {
    return `تعذر العثور على bucket ${bucketName}. أنشئ bucket بالاسم المطلوب وجعله Public.`
  }

  if (normalized.includes('network') || normalized.includes('fetch')) {
    return `تعذر الوصول إلى Supabase Storage. تحقق من اتصال الإنترنت أو إعدادات الشبكة.`
  }

  return `فشل رفع الصورة إلى ${bucketName}: ${rawMessage || 'خطأ غير متوقع'}`
}

export function buildStorageFilePath(folderName, file) {
  const fileExt = file?.name?.split('.').pop() || 'bin'
  const safeExt = String(fileExt).toLowerCase()
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2)}`
  return `${folderName}/${uniqueSuffix}.${safeExt}`
}
