'use client'

/**
 * SkillAutocomplete — controlled chips input with taxonomy-backed autocomplete.
 *
 * - `value` is the current array of skill slugs (canonical / kebab-case).
 * - `onChange` fires with the new array whenever the user adds or removes.
 * - As the user types, we debounce 300ms then query `searchSkills` against the
 *   static taxonomy.
 * - Enter or click selects the highlighted suggestion. Comma also adds the
 *   current input text as a custom skill (normalized via `normalizeSkill`).
 *
 * Renders a hidden `<input name=...>` so the form can serialize this as a
 * comma-joined string just like the previous free-text tags field — `createJob`
 * / `updateJob` parse this back into String[].
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { normalizeSkill, searchSkills } from '@/lib/skills/search'

const chipClass =
  'inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground'

const chipBtnClass =
  'inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:bg-muted-foreground/15 hover:text-foreground'

const inputClass =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60'

export function SkillAutocomplete({
  name,
  value,
  onChange,
  disabled,
  placeholder = 'Ketik untuk mencari skill, Enter untuk menambah',
}: {
  /** Optional hidden form field name (comma-joined). */
  name?: string
  value: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
  placeholder?: string
}) {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 300ms debounce on the query → suggestion search.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300)
    return () => clearTimeout(t)
  }, [query])

  const suggestions = useMemo(() => {
    if (!debounced.trim()) return []
    return searchSkills(debounced, 8).filter((s) => !value.includes(s))
  }, [debounced, value])

  useEffect(() => {
    // Keep highlight in range when suggestions shrink.
    if (activeIndex >= suggestions.length) setActiveIndex(0)
  }, [suggestions.length, activeIndex])

  function addSkill(raw: string) {
    const slug = normalizeSkill(raw)
    if (!slug) return
    if (value.includes(slug)) {
      // Already present — just clear input.
      setQuery('')
      return
    }
    onChange([...value, slug])
    setQuery('')
    setDebounced('')
    setActiveIndex(0)
  }

  function removeSkill(slug: string) {
    onChange(value.filter((s) => s !== slug))
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      if (suggestions.length === 0) return
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % suggestions.length)
      setOpen(true)
      return
    }
    if (e.key === 'ArrowUp') {
      if (suggestions.length === 0) return
      e.preventDefault()
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length)
      setOpen(true)
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (open && suggestions.length > 0) {
        const pick = suggestions[activeIndex] ?? suggestions[0]
        if (pick) addSkill(pick)
      } else if (query.trim()) {
        addSkill(query)
      }
      return
    }
    if (e.key === ',' || (e.key === 'Tab' && query.trim())) {
      e.preventDefault()
      addSkill(query)
      return
    }
    if (e.key === 'Backspace' && query === '' && value.length > 0) {
      // Quick-delete last chip.
      const last = value[value.length - 1]
      if (last) removeSkill(last)
      return
    }
    if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      {value.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5" aria-label="Skill terpilih">
          {value.map((s) => (
            <li key={s} className={chipClass}>
              <span>{s}</span>
              <button
                type="button"
                onClick={() => removeSkill(s)}
                disabled={disabled}
                aria-label={`Hapus ${s}`}
                className={chipBtnClass}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Defer close so dropdown clicks register.
          if (blurTimer.current) clearTimeout(blurTimer.current)
          blurTimer.current = setTimeout(() => setOpen(false), 120)
        }}
        onKeyDown={onKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        className={inputClass}
        aria-autocomplete="list"
        aria-expanded={open && suggestions.length > 0}
        aria-controls="skill-autocomplete-listbox"
        role="combobox"
      />
      {open && suggestions.length > 0 && (
        <ul
          id="skill-autocomplete-listbox"
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-background py-1 shadow-md"
        >
          {suggestions.map((s, i) => (
            <li
              key={s}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={(e) => {
                // Prevent input blur racing with click.
                e.preventDefault()
                addSkill(s)
                inputRef.current?.focus()
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`cursor-pointer px-3 py-1.5 text-sm ${
                i === activeIndex
                  ? 'bg-muted text-foreground'
                  : 'text-foreground hover:bg-muted/60'
              }`}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
      {/* Serialize to comma-joined string so existing FormData parser works unchanged. */}
      {name ? <input type="hidden" name={name} value={value.join(', ')} /> : null}
    </div>
  )
}
