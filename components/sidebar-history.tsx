'use client';

import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { User } from 'next-auth';
import React, { memo, useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import useSWRInfinite from 'swr/infinite';
import { useIntersection } from '@mantine/hooks';

import {
  CheckCircleFillIcon,
  GlobeIcon,
  LockIcon,
  MoreHorizontalIcon,
  ShareIcon,
  TrashIcon,
  PenIcon,
  LoaderIcon,
} from '@/components/icons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Check, X } from 'lucide-react';
import type { Chat } from '@/lib/db/schema';
import { checkEnglishString, fetcher } from '@/lib/utils';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { PaginatedResponse } from "@/hooks/use-chat-history-cache";
import { BetterTooltip } from './ui/tooltip';

type GroupedChats = {
  today: Chat[];
  yesterday: Chat[];
  lastWeek: Chat[];
  lastMonth: Chat[];
  older: Chat[];
};

const PureChatItem = ({
  chat,
  isActive,
  isLoading,
  onDelete,
  onEdit,
  setOpenMobile,
}: {
  chat: Chat;
  isActive: boolean;
  isLoading: boolean;
  onDelete: (chatId: string) => void;
  onEdit: (chatId: string, title: string) => Promise<void>;
  setOpenMobile: (open: boolean) => void;
}) => {
  const { visibilityType, setVisibilityType } = useChatVisibility({
    chatId: chat.id,
    initialVisibility: chat.visibility,
  });
  const [editMode, setEditMode] = useState(false);
  const [inputValue, setInputValue] = useState(chat.title || "");

  const editTitle = () => {
    onEdit(chat.id, inputValue).then(() => setEditMode(false));
  };

  return (
    <SidebarMenuItem>
      {
       isLoading && (
          <div className="flex size-full rounded-md bg-black absolute items-center justify-center opacity-80">
            <div className="animate-spin">
              <LoaderIcon />
            </div>
          </div>
        )
      }

      {
        editMode ? (
          <div className="flex items-center h-[32px] w-4/5">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full p-1 rounded-md"
              style={{ direction: checkEnglishString(inputValue) ? "ltr" : "rtl" }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  editTitle();
                }
              }}
            />
            <Check onClick={editTitle} className="absolute top-1 left-8 cursor-pointer" height={20} width={20} />
          </div>
        ) : (
          <BetterTooltip content={chat.title} align="start">
            <SidebarMenuButton asChild isActive={isActive}>
              <Link href={`/chat/${chat.id}`} onClick={() => setOpenMobile(false)}>
                <span>{chat.title}</span>
              </Link>
            </SidebarMenuButton>
          </BetterTooltip>
        )
      }

      {
        editMode ?
          <X className="absolute left-1 top-1 cursor-pointer" height={20} width={20} onClick={() => setEditMode(false)} /> :
          <DropdownMenu modal={true} dir="rtl">
            <DropdownMenuTrigger asChild>
              <SidebarMenuAction
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground mr-0.5"
                showOnHover={!isActive}
              >
                <MoreHorizontalIcon />
                <span className="sr-only">بیشتر</span>
              </SidebarMenuAction>
            </DropdownMenuTrigger>

            <DropdownMenuContent side="bottom" align="start">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  <ShareIcon />
                  <span>اشتراک گذاری</span>
                </DropdownMenuSubTrigger>

                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      className="cursor-pointer flex-row justify-between"
                      onClick={() => {
                        setVisibilityType('private');
                      }}
                    >
                      <div className="flex flex-row gap-2 items-center">
                        <LockIcon size={12} />
                        <span>خصوصی</span>
                      </div>
                      {visibilityType === 'private' ? (
                        <CheckCircleFillIcon />
                      ) : null}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer flex-row justify-between"
                      onClick={() => {
                        setVisibilityType('public');
                      }}
                    >
                      <div className="flex flex-row gap-2 items-center">
                        <GlobeIcon />
                        <span>عمومی</span>
                      </div>
                      {visibilityType === 'public' ? <CheckCircleFillIcon /> : null}
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuSeparator/>

              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={() => setEditMode(true)}
              >
                <PenIcon />
                <span>ویرایش</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive dark:text-red-500"
                onSelect={() => onDelete(chat.id)}
              >
                <TrashIcon />
                <span>حذف</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
      }
    </SidebarMenuItem>
  );
};

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => prevProps.isActive === nextProps.isActive && prevProps.isLoading === nextProps.isLoading && prevProps.chat.title === nextProps.chat.title);

export function SidebarHistory({ user }: { user: User | undefined }) {
  const { setOpenMobile } = useSidebar();
  const { id } = useParams();

  const [loadingChatId, setLoadingChatId] = useState<string | null>(null);

  const getKey = (pageIndex: number, previousPageData: PaginatedResponse | null) => {
    if (!user) return null;

    if (previousPageData && !previousPageData.nextCursor) return null;

    if (pageIndex === 0) return '/api/history';

    return `/api/history?cursor=${previousPageData?.nextCursor}`;
  };

  const {
    data: pages,
    isLoading,
    setSize,
    mutate,
  } = useSWRInfinite<PaginatedResponse>(getKey, fetcher, {
    revalidateFirstPage: true,
    revalidateOnFocus: true,
    dedupingInterval: 0,
    persistSize: true
  });

  const lastChatRef = useRef<HTMLDivElement>(null);
  const { ref, entry } = useIntersection({
    root: lastChatRef.current,
    threshold: 1,
  });

  useEffect(() => {
    if (entry?.isIntersecting) {
      setSize((size) => size + 1);
    }
  }, [entry, setSize]);

  const history = pages?.flatMap(page => page.items) ?? [];

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();

  const handleDeleteClick = (chatId: string) => {
    setDeleteId(chatId);
    setShowDeleteDialog(true);
  }

  const handleDelete = async () => {
    setLoadingChatId(deleteId);

    const deletePromise = fetch(`/api/chat?id=${deleteId}`, {
      method: 'DELETE',
    });

    toast.promise(deletePromise, {
      loading: 'در حال پاک کردن مکالمه...',
      success: () => {
        mutate((pages) => {
          if (!pages) return pages;

          return pages.map(page => ({
            ...page,
            items: page.items.filter(chat => chat.id !== deleteId)
          }));
        }, {
          revalidate: false // Don't revalidate as we've already updated the cache
        });

        return 'مکالمه پاک شد';
      },
      error: 'پاک کردن مکالمه با مشکل مواجه شد',
      finally: () => setLoadingChatId(null),
    });

    setShowDeleteDialog(false);

    if (deleteId === id) {
      router.push('/chat');
    }
  };

  const handleEdit = async (id: string, title: string) => {
    setLoadingChatId(id);

    const editPromise = fetch(`/api/chat?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({title}),
    });

    toast.promise(editPromise, {
      loading: 'در حال ویرایش عنوان مکالمه...',
      success: () => {
        mutate((pages) => {
          if (!pages) return pages;

          return pages.map(page => ({
            ...page,
            items: page.items.map(chat => chat.id === id ? {...chat, title} : chat)
          }));
        }, {
          revalidate: false // Don't revalidate as we've already updated the cache
        });

        return 'عنوان مکالمه ویرایش شد';
      },
      error: 'ویرایش عنوان مکالمه با مشکل مواجه شد',
      finally: () => setLoadingChatId(null),
    });
  };

  if (!user) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            <div>برای ذخیره و مشاهده مکالمه ها باید وارد شوید!</div>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (isLoading) {
    return (
      <SidebarGroup>
        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
          امروز
        </div>
        <SidebarGroupContent>
          <div className="flex flex-col">
            {[44, 32, 28, 64, 52].map((item) => (
              <div
                key={item}
                className="rounded-md h-8 flex gap-2 px-2 items-center"
              >
                <div
                  className="h-4 rounded-md flex-1 max-w-[--skeleton-width] bg-sidebar-accent-foreground/10"
                  style={
                    {
                      '--skeleton-width': `${item}%`,
                    } as React.CSSProperties
                  }
                />
              </div>
            ))}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (history?.length === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            وقتی شروع به استفاده کنید، مکالمه های شما در اینجا نمایش داده خواهند شد!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  const groupChatsByDate = (chats: Chat[]): GroupedChats => {
    const now = new Date();
    const oneWeekAgo = subWeeks(now, 1);
    const oneMonthAgo = subMonths(now, 1);

    return chats.reduce(
      (groups, chat) => {
        const chatDate = new Date(chat.createdAt);

        if (isToday(chatDate)) {
          groups.today.push(chat);
        } else if (isYesterday(chatDate)) {
          groups.yesterday.push(chat);
        } else if (chatDate > oneWeekAgo) {
          groups.lastWeek.push(chat);
        } else if (chatDate > oneMonthAgo) {
          groups.lastMonth.push(chat);
        } else {
          groups.older.push(chat);
        }

        return groups;
      },
      {
        today: [],
        yesterday: [],
        lastWeek: [],
        lastMonth: [],
        older: [],
      } as GroupedChats,
    );
  };

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {history &&
              (() => {
                const groupedChats = groupChatsByDate(history);

                return (
                  <>
                    {groupedChats.today.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                          امروز
                        </div>
                        {groupedChats.today.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            isLoading={chat.id === loadingChatId}
                            onDelete={handleDeleteClick}
                            onEdit={handleEdit}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </>
                    )}

                    {groupedChats.yesterday.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                          دیروز
                        </div>
                        {groupedChats.yesterday.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            isLoading={chat.id === loadingChatId}
                            onDelete={handleDeleteClick}
                            onEdit={handleEdit}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </>
                    )}

                    {groupedChats.lastWeek.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                          7 روز اخیر
                        </div>
                        {groupedChats.lastWeek.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            isLoading={chat.id === loadingChatId}
                            onDelete={handleDeleteClick}
                            onEdit={handleEdit}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </>
                    )}

                    {groupedChats.lastMonth.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                          1 ماه اخیر
                        </div>
                        {groupedChats.lastMonth.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            isLoading={chat.id === loadingChatId}
                            onDelete={handleDeleteClick}
                            onEdit={handleEdit}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </>
                    )}

                    {groupedChats.older.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                          قدیمی تر
                        </div>
                        {groupedChats.older.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            isLoading={chat.id === loadingChatId}
                            onDelete={handleDeleteClick}
                            onEdit={handleEdit}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </>
                    )}

                    <div ref={ref} className="h-1" />
                  </>
                );
              })()}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>مطمئنی؟</AlertDialogTitle>
            <AlertDialogDescription>
              این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleDelete}>
              انجام بده
            </AlertDialogAction>
            <AlertDialogCancel>پشیمون شدم</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
