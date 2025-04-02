import React from 'react';

import { cookies } from 'next/headers';
import Script from 'next/script';
import { redirect } from 'next/navigation';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

import { auth } from '@/app/(auth)/auth';
import { getUserBalance } from '@/lib/db/queries';

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  // Redirect to login if user is not authenticated or missing name information
  if (!session?.user?.id || !session?.user?.firstName || !session?.user?.lastName) {
    redirect('/auth');
  }

  const balance = await getUserBalance(session.user.id);

  return (
    <>
      <Script src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js" strategy="beforeInteractive" />
      <SidebarProvider defaultOpen={!isCollapsed} initialBalance={balance || 0}>
        <AppSidebar user={session?.user} />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </>
  );
}
