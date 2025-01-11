'use client';

import { LoaderIcon } from '@/components/icons';
import { Button } from './ui/button';

export function SubmitButton({
  children,
  isLoading,
}: {
  children: React.ReactNode;
  isLoading: boolean;
}) {
  return (
    <Button
      type={isLoading ? 'button' : 'submit'}
      aria-disabled={isLoading}
      disabled={isLoading}
      className="relative"
    >
      {children}

      {isLoading && (
        <span className="animate-spin absolute right-4">
          <LoaderIcon />
        </span>
      )}

      <output aria-live="polite" className="sr-only">
        {isLoading ? 'Loading' : 'Submit form'}
      </output>
    </Button>
  );
}
