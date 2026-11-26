/**
 * Download a note as a sanitized `.md` file in the browser.
 */
export function exportNoteAsMarkdown(title, content = '') {
  const cleanTitle = (title || 'untitled').replace(/[/\\?%*:|"<>]/g, '-').trim()
  const blob = new Blob([`# ${title || 'Untitled'}\n\n${content}`], {
    type: 'text/markdown;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${cleanTitle}.md`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

