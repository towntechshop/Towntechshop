import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const ABOUT_PAGE_ENTRY = {
  id: 'about-page',
  title: 'من نحن',
  slug: 'about',
  page_type: 'about',
  is_published: true,
  isVisualEditor: true,
}

const CONTACT_PAGE_ENTRY = {
  id: 'contact-page',
  title: 'تواصل معنا',
  slug: 'contact',
  page_type: 'contact',
  is_published: true,
  isVisualEditor: true,
}

const OUR_WORK_PAGE_ENTRY = {
  id: 'our-work-page',
  title: 'أعمالنا',
  slug: 'our-work',
  page_type: 'page',
  is_published: true,
  isVisualEditor: true,
}

function buildDisplayPages(pages) {
  const otherPages = pages.filter(
    (page) =>
      page.slug !== 'about' &&
      page.slug !== 'contact' &&
      page.slug !== 'our-work'
  )

  const aboutFromDb = pages.find((page) => page.slug === 'about')
  const contactFromDb = pages.find((page) => page.slug === 'contact')
  const ourWorkFromDb = pages.find((page) => page.slug === 'our-work')

  const aboutPage = aboutFromDb
    ? { ...aboutFromDb, isVisualEditor: true }
    : ABOUT_PAGE_ENTRY

  const contactPage = contactFromDb
    ? { ...contactFromDb, isVisualEditor: true }
    : CONTACT_PAGE_ENTRY

  const ourWorkPage = ourWorkFromDb
    ? { ...ourWorkFromDb, isVisualEditor: true }
    : OUR_WORK_PAGE_ENTRY

  return [aboutPage, contactPage, ourWorkPage, ...otherPages]
}

function PageStatusBadge({ page }) {
  if (page.isVisualEditor) {
    return (
      <span className="inline-flex bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-black">
        تصميم مرئي
      </span>
    )
  }

  return (
    <span
      className={
        page.is_published
          ? 'inline-flex bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-black'
          : 'inline-flex bg-red-50 text-red-700 px-3 py-1.5 rounded-full text-xs font-black'
      }
    >
      {page.is_published ? 'منشورة' : 'غير منشورة'}
    </span>
  )
}

export default function AdminPages() {
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const getPages = async () => {
    setLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('site_pages')
      .select('*')
      .order('page_type', { ascending: true })
      .order('title', { ascending: true })

    if (error) {
      setErrorMessage(error.message)
      setPages([])
    } else {
      setPages(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    getPages()
  }, [])

  const displayPages = useMemo(() => buildDisplayPages(pages), [pages])

  const translatePageType = (type) => {
    const types = {
      page: 'صفحة',
      policy: 'سياسة',
      legal: 'قانوني',
      contact: 'تواصل',
      about: 'من نحن',
    }

    return types[type] || type || '-'
  }

  const publishedCount = displayPages.filter(
    (page) => page.isVisualEditor || page.is_published
  ).length
  const hiddenCount = displayPages.filter(
    (page) => !page.isVisualEditor && !page.is_published
  ).length

  return (
    <div dir="rtl">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-slate-500 mt-2 font-bold">
            تعديل صفحات الموقع مثل من نحن، سياسة الخصوصية، الشحن والاسترجاع
          </p>
        </div>

        <button
          type="button"
          onClick={getPages}
          className="w-full md:w-auto bg-white border border-slate-200 text-slate-950 px-5 py-3 rounded-2xl font-black hover:bg-slate-50 transition"
        >
          تحديث الصفحات
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-5 text-center">
          <p className="text-xs md:text-sm text-slate-500 font-bold">
            الإجمالي
          </p>

          <h3 className="text-2xl md:text-3xl font-black text-slate-950 mt-2">
            {displayPages.length}
          </h3>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-5 text-center">
          <p className="text-xs md:text-sm text-slate-500 font-bold">
            منشورة
          </p>

          <h3 className="text-2xl md:text-3xl font-black text-green-600 mt-2">
            {publishedCount}
          </h3>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-5 text-center">
          <p className="text-xs md:text-sm text-slate-500 font-bold">
            مخفية
          </p>

          <h3 className="text-2xl md:text-3xl font-black text-red-600 mt-2">
            {hiddenCount}
          </h3>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-4 mb-6 font-bold">
          {errorMessage}
        </div>
      )}

      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 md:p-6 border-b border-slate-200 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-950">
              قائمة الصفحات
            </h2>

            <p className="text-slate-500 mt-1 font-bold text-sm">
              «من نحن» و«تواصل معنا» و«أعمالنا» بتصميم مرئي — باقي الصفحات نصية
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-20 bg-slate-100 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : displayPages.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-4xl mb-4">
              📄
            </div>

            <h3 className="text-2xl font-black text-slate-950">
              لا توجد صفحات
            </h3>

            <p className="text-slate-500 mt-2 font-bold">
              لا توجد صفحات أو سياسات مسجلة حاليا.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-4 font-black text-slate-700">
                      عنوان الصفحة
                    </th>

                    <th className="p-4 font-black text-slate-700">
                      الرابط
                    </th>

                    <th className="p-4 font-black text-slate-700">
                      النوع
                    </th>

                    <th className="p-4 font-black text-slate-700">
                      حالة النشر
                    </th>

                    <th className="p-4 font-black text-slate-700">
                      الإجراءات
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {displayPages.map((page) => (
                    <tr
                      key={page.id}
                      className="border-t border-slate-200 hover:bg-slate-50 transition"
                    >
                      <td className="p-4">
                        <p className="font-black text-slate-950">
                          {page.title}
                        </p>
                      </td>

                      <td className="p-4">
                        <span className="inline-flex bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl font-bold text-sm">
                          /{page.slug}
                        </span>
                      </td>

                      <td className="p-4 text-slate-600 font-bold">
                        {translatePageType(page.page_type)}
                      </td>

                      <td className="p-4">
                        <PageStatusBadge page={page} />
                      </td>

                      <td className="p-4">
                        <Link
                          to={`/admin/pages/${page.slug}`}
                          className="inline-flex bg-blue-50 text-blue-700 px-5 py-2 rounded-xl font-black hover:bg-blue-100 transition"
                        >
                          تعديل
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden p-4 space-y-4">
              {displayPages.map((page) => (
                <div
                  key={page.id}
                  className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black text-slate-950 text-lg">
                        {page.title}
                      </h3>

                      <p className="text-slate-500 text-sm font-bold mt-1">
                        /{page.slug}
                      </p>
                    </div>

                    <PageStatusBadge page={page} />
                  </div>

                  <div className="mt-4 bg-slate-50 rounded-2xl p-3">
                    <p className="text-slate-500 text-xs font-bold">
                      نوع الصفحة
                    </p>

                    <p className="text-slate-950 font-black mt-1">
                      {translatePageType(page.page_type)}
                    </p>
                  </div>

                  <Link
                    to={`/admin/pages/${page.slug}`}
                    className="mt-4 block w-full bg-blue-50 text-blue-700 px-5 py-3 rounded-2xl font-black text-center hover:bg-blue-100 transition"
                  >
                    تعديل الصفحة
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}