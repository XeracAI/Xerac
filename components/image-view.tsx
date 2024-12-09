import Image from 'next/image'
import {toast} from 'sonner'
import {useCopyToClipboard} from 'usehooks-ts'

import {CopyIcon} from './icons'
import {Button} from './ui/button'
import {Tooltip, TooltipContent, TooltipTrigger} from './ui/tooltip'

interface ImageViewProps {
  src: string
  title: string
  createdAt?: Date
  isContentDirty?: boolean
}

export function ImageView({src, title, createdAt, isContentDirty}: ImageViewProps) {
  const [_, copyToClipboard] = useCopyToClipboard()

  return (
    <div className="flex flex-col w-full">
      <div className="relative mt-4 rounded-lg overflow-hidden">
        <Image src={src} alt={title} width={600} height={400} className="object-contain" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="absolute top-2 right-2 p-2 h-fit"
              onClick={() => {
                copyToClipboard(src)
                toast.success('Image URL copied to clipboard!')
              }}
            >
              <CopyIcon size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy image URL</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
