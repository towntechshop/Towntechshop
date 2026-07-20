import { RETURN_POLICY_SUMMARY, STORE_ABOUT_TEXT } from './siteContent'

export const ABOUT_ICON_KEYS = ['price', 'payment', 'warranty', 'return']

export function createDefaultAboutPage(brandName = 'Town Tech') {
  return {
    hero: {
      mediaType: 'image',
      imageUrl: '',
      videoUrl: '',
      title: `Welcome to ${brandName}`,
      subtitle: 'اعرف أكتر عننا',
    },
    intro: {
      title: 'من نحن؟',
      content: STORE_ABOUT_TEXT,
      mediaType: 'image',
      imageUrl: '',
      videoUrl: '',
    },
    why: {
      title: `لماذا ${brandName}`,
      subtitle: `ما يميز ${brandName}`,
      mediaType: 'image',
      imageUrl: '',
      videoUrl: '',
      features: [
        {
          iconKey: 'price',
          iconUrl: '',
          title: 'أفضل الأسعار',
          description:
            'نقدم أسعاراً منافسة وعروضاً مستمرة على أنظمة المراقبة ومستلزماتها لتناسب الأفراد والمؤسسات.',
        },
        {
          iconKey: 'payment',
          iconUrl: '',
          title: 'طرق الدفع',
          description:
            'نوفر طرق دفع متعددة تشمل الدفع عند الاستلام والبطاقات البنكية وفودافون كاش وإنستا باي.',
        },
        {
          iconKey: 'warranty',
          iconUrl: '',
          title: 'ضمان الوكيل',
          description:
            'جميع منتجاتنا بضمان الوكيل مع أطول فترة ضمان في السوق ودعم فني موثوق.',
        },
        {
          iconKey: 'return',
          iconUrl: '',
          title: 'استبدال واسترجاع',
          description: `${RETURN_POLICY_SUMMARY}.`,
        },
      ],
    },
    mission: {
      title: 'مهمتنا',
      content:
        'نسعى لتقديم أحدث حلول أنظمة المراقبة الأمنية بجودة عالية وأسعار منافسة، مع دعم فني متميز يضمن راحة عملائنا وثقتهم في خدماتنا على المدى الطويل.',
      mediaType: 'image',
      imageUrl: '',
      videoUrl: '',
    },
    vision: {
      title: 'رؤيتنا',
      content:
        'أن نكون الخيار الأول في أنظمة المراقبة والأمن في مصر، من خلال الجودة والثقة وخدمة ما بعد البيع المتميزة.',
      mediaType: 'image',
      imageUrl: '',
      videoUrl: '',
    },
  }
}

function normalizeMediaSection(section) {
  if (!section || typeof section !== 'object') return section

  return {
    ...section,
    mediaType: 'image',
    videoUrl: '',
  }
}

export function mergeAboutPage(data, brandName = 'Town Tech') {
  const defaults = createDefaultAboutPage(brandName)

  if (!data || typeof data !== 'object') {
    return defaults
  }

  return {
    hero: normalizeMediaSection({ ...defaults.hero, ...(data.hero || {}) }),
    intro: normalizeMediaSection({ ...defaults.intro, ...(data.intro || {}) }),
    why: normalizeMediaSection({
      ...defaults.why,
      ...(data.why || {}),
      features:
        Array.isArray(data.why?.features) && data.why.features.length > 0
          ? data.why.features.map((feature, index) => ({
              ...defaults.why.features[index % defaults.why.features.length],
              ...feature,
            }))
          : defaults.why.features,
    }),
    mission: normalizeMediaSection({ ...defaults.mission, ...(data.mission || {}) }),
    vision: normalizeMediaSection({ ...defaults.vision, ...(data.vision || {}) }),
  }
}
