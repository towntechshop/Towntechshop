export default function AdminPagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  itemLabel = 'عنصر',
}) {
  if (totalPages <= 1) return null

  const from = (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50/80">
      <p className="text-xs text-slate-500 font-bold">
        عرض {from}–{to} من {totalItems} {itemLabel}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-black text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition"
        >
          السابق
        </button>

        <span className="text-xs font-black text-slate-600 min-w-[64px] text-center">
          {currentPage} / {totalPages}
        </span>

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-black text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition"
        >
          التالي
        </button>
      </div>
    </div>
  )
}
