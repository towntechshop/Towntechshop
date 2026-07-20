export function createDefaultOurWorkPage() {
  return {
    title: 'أعمالنا',
    subtitle: 'نماذج من مشاريعنا وتركيبات أنظمة المراقبة',
    showOnHome: true,
    homeTitle: 'أعمالنا',
    homeSubtitle: 'نماذج من أعمالنا',
    homeMaxImages: 6,
    isPublished: true,
    images: [],
  }
}

export function mergeOurWorkPage(data) {
  const defaults = createDefaultOurWorkPage()

  if (!data || typeof data !== 'object') {
    return defaults
  }

  return {
    ...defaults,
    ...data,
    isPublished: data.isPublished !== false,
    showOnHome: data.showOnHome !== false,
    homeMaxImages: Number(data.homeMaxImages || defaults.homeMaxImages) || 6,
    images: Array.isArray(data.images)
      ? data.images.filter((item) => item?.imageUrl?.trim())
      : defaults.images,
  }
}

export function createOurWorkImage(partial = {}) {
  return {
    id:
      partial.id ||
      `work-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    imageUrl: partial.imageUrl || '',
    title: partial.title || '',
    caption: partial.caption || '',
  }
}
