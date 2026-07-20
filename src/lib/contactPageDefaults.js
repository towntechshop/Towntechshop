import {
  CONTACT_PAGE,
  STORE_BRANCHES,
  STORE_EMAIL,
  STORE_FACEBOOK_URL,
  STORE_PHONES,
  STORE_WHATSAPP,
} from './siteContent'

export function createDefaultContactPage() {
  return {
    title: CONTACT_PAGE.title,
    subtitle: CONTACT_PAGE.subtitle,
    branchesTitle: 'الفروع',
    branches: STORE_BRANCHES.map((branch) => ({ ...branch })),
    contactTitle: 'للتواصل',
    phones: [...STORE_PHONES],
    email: STORE_EMAIL,
    whatsapp: STORE_WHATSAPP,
    facebookUrl: STORE_FACEBOOK_URL,
    showWhatsapp: true,
    showFacebook: true,
    form: {
      namePlaceholder: 'الاسم',
      emailPlaceholder: 'بريدك الإلكتروني',
      subjectPlaceholder: 'الموضوع',
      messagePlaceholder: 'رسالتك',
      submitText: 'إرسال رسالة',
      successMessage: 'تم إرسال رسالتك بنجاح. سيتواصل معك فريقنا في أقرب وقت.',
    },
  }
}

export function mergeContactPage(data) {
  const defaults = createDefaultContactPage()

  if (!data || typeof data !== 'object') {
    return defaults
  }

  return {
    ...defaults,
    ...data,
    branches:
      Array.isArray(data.branches) && data.branches.length > 0
        ? data.branches
        : defaults.branches,
    phones:
      Array.isArray(data.phones) && data.phones.length > 0
        ? data.phones
        : defaults.phones,
    form: {
      ...defaults.form,
      ...(data.form || {}),
    },
  }
}
