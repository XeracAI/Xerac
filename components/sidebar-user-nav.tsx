'use client';

import Link from 'next/link';

import { ChevronUp } from 'lucide-react';
import Image from 'next/image';
import type { User } from 'next-auth';
import { useTheme } from 'next-themes';
import { trackSignOutAndSignOut } from '@/app/(auth)/signout-action';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';

export function SidebarUserNav({ user }: { user: User }) {
  const { setTheme, theme } = useTheme();
  const { balance } = useSidebar();

  const handleSignOut = async () => {
    if (user?.id) {
      // Call the server action which will track the sign out event
      await trackSignOutAndSignOut(user.id);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu dir="rtl">
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent bg-background data-[state=open]:text-sidebar-accent-foreground h-10">
              <Image
                src={`https://avatar.vercel.sh/${user.email}`}
                alt={user.email ?? 'عکس پروفایل کاربر'}
                width={24}
                height={24}
                className="rounded-full"
              />
              <span className="truncate">{`خوش اومدی ${user?.firstName}!` || user?.email || `0${user?.phoneNumber}`}</span>
              <ChevronUp className="mr-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
            <DropdownMenuItem asChild>
              {/* TODO link to billing page */}
              <Link
                href="/chat"
                className="w-full cursor-pointer flex flex-col bg-gradient-to-bl from-[hsl(var(--accent))] to-[hsl(var(--background))] mb-1"
              >
                <div className="text-xs w-full text-start">اعتبار شما:</div>
                <div className="text-xl font-bold pt-2 pb-5" style={{ direction: 'ltr' }}>
                  {balance}
                </div>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onSelect={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {`تغییر حالت ${theme === 'light' ? 'تاریک' : 'روشن'}`}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <button type="button" className="w-full cursor-pointer" onClick={handleSignOut}>
                خروج
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
