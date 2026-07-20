export function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block mb-2 text-sm font-black text-slate-700">
        {label}
      </label>

      {children}

      {hint && (
        <p className="text-xs text-slate-500 mt-2 font-bold leading-6">
          {hint}
        </p>
      )}
    </div>
  )
}

export function SectionTitle({ title, description }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl md:text-2xl font-black text-slate-950">
        {title}
      </h2>

      {description && (
        <p className="text-slate-500 mt-1 font-bold text-sm leading-6">
          {description}
        </p>
      )}
    </div>
  )
}
