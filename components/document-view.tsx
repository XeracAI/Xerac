import type {Document, Suggestion} from '@/lib/db/schema'
import cx from 'classnames'
import {formatDistance} from 'date-fns'
import {toast} from 'sonner'
import {useCopyToClipboard} from 'usehooks-ts'

import {CopyIcon, DeltaIcon, RedoIcon, UndoIcon} from './icons'
import {Button} from './ui/button'
import {Tooltip, TooltipContent, TooltipTrigger} from './ui/tooltip'
import {Editor} from './editor'
import {DiffView} from './diffview'
import {DocumentSkeleton} from './document-skeleton'

interface DocumentViewProps {
  document: Document | null
  content: string
  title: string
  mode: 'edit' | 'diff'
  status: 'streaming' | 'idle'
  isCurrentVersion: boolean
  currentVersionIndex: number
  isContentDirty: boolean
  isDocumentsFetching: boolean
  suggestions?: Suggestion[]
  getDocumentContentById: (index: number) => string
  handleVersionChange: (type: 'next' | 'prev' | 'toggle' | 'latest') => void
  saveContent: (content: string, debounce: boolean) => void
}

export function DocumentView({
  document,
  content,
  title,
  mode,
  status,
  isCurrentVersion,
  currentVersionIndex,
  isContentDirty,
  isDocumentsFetching,
  suggestions = [],
  getDocumentContentById,
  handleVersionChange,
  saveContent,
}: DocumentViewProps) {
  const [_, copyToClipboard] = useCopyToClipboard()

  return (
    <div className="flex flex-col w-full">
      <div className="mt-4">
        {isDocumentsFetching && !content ? (
          <DocumentSkeleton />
        ) : mode === 'edit' ? (
          <Editor
            content={isCurrentVersion ? content : getDocumentContentById(currentVersionIndex)}
            isCurrentVersion={isCurrentVersion}
            currentVersionIndex={currentVersionIndex}
            status={status}
            saveContent={saveContent}
            suggestions={isCurrentVersion ? suggestions : []}
          />
        ) : (
          <DiffView oldContent={getDocumentContentById(currentVersionIndex - 1)} newContent={getDocumentContentById(currentVersionIndex)} />
        )}
      </div>
    </div>
  )
}
