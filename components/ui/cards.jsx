import {cn} from '@/lib/utils'

export const Card = ({className, children}) => {
  return (
    <div
      className={cn(
        'relative rounded-xl border border-[rgba(255,255,255,0.10)] dark:bg-[rgba(31,44,60,0.70)] bg-gray-100 shadow-[2px_4px_16px_0px_rgba(248,248,248,0.06)_inset] group',
        className
      )}
    >
      {children}
    </div>
  )
}

export const CardTitle = ({children, className}) => {
  return <h3 className={cn('text-lg font-semibold text-gray-800 dark:text-white py-2', className)}>{children}</h3>
}

export const CardDescription = ({children, className}) => {
  return <p className={cn('text-sm font-semibold text-neutral-600 dark:text-neutral-300 max-w-sm', className)}>{children}</p>
}

export const CardSkeletonContainer = ({className, children, showGradient = true}) => {
  return (
    <div
      className={cn(
        'rounded-xl z-40',
        className,
        showGradient &&
          'bg-[#1F2C3C] dark:bg-[rgba(31,44,60,0.70)] [mask-image:radial-gradient(70%_70%_at_50%_50%,white_0%,transparent_100%)]'
      )}
    >
      {children}
    </div>
  )
}
