// تصدير جدول لملف يفتح في Excel (CSV بترميز UTF-8 عشان العربي يظهر صح)

function escapeCell(value) {
  if (value === null || value === undefined) return ''
  const text = String(value)
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

export function downloadCsv(filename, columns, rows) {
  const header = columns.map((column) => escapeCell(column.label)).join(',')
  const body = rows
    .map((row) =>
      columns
        .map((column) => escapeCell(typeof column.value === 'function' ? column.value(row) : row[column.key]))
        .join(',')
    )
    .join('\r\n')

  const blob = new Blob(['﻿' + header + '\r\n' + body], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function formatDateTime(value) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleString('en-GB', { timeZone: 'Africa/Cairo' })
  } catch {
    return String(value)
  }
}

export function todayStamp() {
  return new Date().toISOString().slice(0, 10)
}
