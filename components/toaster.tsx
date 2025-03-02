'use client';

import { Toaster as SonnerToaster, type ToasterProps } from 'sonner';
import { useTheme } from 'next-themes';

export function Toaster() {
  const { resolvedTheme } = useTheme();

  return <SonnerToaster position="top-center" toastOptions={{ style: { fontFamily: "Shabnam, ui-sans-serif, system-ui, -apple-system" } }} closeButton theme={resolvedTheme as ToasterProps['theme']} />;
}
