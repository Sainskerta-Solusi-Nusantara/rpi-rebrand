'use client'

import * as React from 'react'
import { UploadCloud, X, File as FileIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FileUploadProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  accept?: string
  multiple?: boolean
  maxSizeMB?: number
  disabled?: boolean
  value?: File[]
  defaultValue?: File[]
  onChange?: (files: File[]) => void
  label?: React.ReactNode
  description?: React.ReactNode
  error?: React.ReactNode
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  (
    {
      className,
      accept,
      multiple,
      maxSizeMB,
      disabled,
      value,
      defaultValue,
      onChange,
      label = 'Tarik & lepas berkas di sini',
      description,
      error,
      ...props
    },
    ref,
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [internalFiles, setInternalFiles] = React.useState<File[]>(defaultValue ?? [])
    const files = value ?? internalFiles
    const [isDragging, setDragging] = React.useState(false)

    const setFiles = (next: File[]) => {
      if (value === undefined) setInternalFiles(next)
      onChange?.(next)
    }

    const handleFiles = (incoming: FileList | null) => {
      if (!incoming) return
      const arr = Array.from(incoming)
      const filtered = maxSizeMB
        ? arr.filter((f) => f.size <= maxSizeMB * 1024 * 1024)
        : arr
      setFiles(multiple ? [...files, ...filtered] : filtered.slice(0, 1))
    }

    const onDragOver = (e: React.DragEvent) => {
      e.preventDefault()
      if (!disabled) setDragging(true)
    }
    const onDragLeave = (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
    }
    const onDrop = (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      if (disabled) return
      handleFiles(e.dataTransfer.files)
    }

    const removeAt = (idx: number) => {
      setFiles(files.filter((_, i) => i !== idx))
    }

    return (
      <div ref={ref} className={cn('flex flex-col gap-2', className)} {...props}>
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled || undefined}
          aria-invalid={error ? true : undefined}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 hover:bg-muted/50',
            disabled && 'pointer-events-none opacity-50',
            error && 'border-destructive',
          )}
        >
          <UploadCloud className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">{label}</p>
          {(description || accept || maxSizeMB) && (
            <p className="text-xs text-muted-foreground">
              {description ?? (
                <>
                  {accept && <>Format: {accept}</>}
                  {accept && maxSizeMB && <> · </>}
                  {maxSizeMB && <>Maks {maxSizeMB} MB</>}
                </>
              )}
            </p>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            className="sr-only"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {files.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {files.map((f, idx) => (
              <li
                key={`${f.name}-${idx}`}
                className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
              >
                <FileIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{f.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatBytes(f.size)}</span>
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  aria-label={`Hapus ${f.name}`}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {error && <p className="text-xs font-medium text-destructive">{error}</p>}
      </div>
    )
  },
)
FileUpload.displayName = 'FileUpload'
