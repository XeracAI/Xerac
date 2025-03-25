'use client';

import React, { startTransition, useContext, useMemo, useOptimistic, useState } from 'react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';

import { saveChatModelAsCookie } from '@/app/(chat)/chat/actions';

import type { Model } from '@/lib/ai/types';
import { cn } from '@/lib/utils';
import { ModelContext } from '@/contexts/models';

import { CheckCircleFillIcon, ChevronDownIcon } from './icons';

export function ModelSelector({
  selectedModel,
  className,
}: {
  selectedModel?: Model | null;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [optimisticModelId, setOptimisticModelId] = useOptimistic(selectedModel?.id);
  const modelContext = useContext(ModelContext);
  const modelGroups = modelContext.userModelGroups;

  return useMemo(
    () => (
      <DropdownMenu open={open} onOpenChange={setOpen} dir="rtl">
        <DropdownMenuTrigger
          asChild
          className={cn(
            'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
            className,
          )}
        >
          <Button
            data-testid="model-selector"
            variant="outline"
            className="md:px-2 md:h-[34px]"
          >
            {selectedModel?.label}
            <ChevronDownIcon />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="max-h-[90vh] overflow-scroll">
          {modelGroups.map((modelGroup, index) => (
            <React.Fragment key={modelGroup.id}>
              <DropdownMenuGroup>
                <DropdownMenuLabel>{modelGroup.title}</DropdownMenuLabel>

                {modelGroup.models.map((model) => (
                  <DropdownMenuItem
                    data-testid={`model-selector-item-${model.id}`}
                    key={model.id}
                    onSelect={() => {
                      setOpen(false);

                      startTransition(() => {
                        setOptimisticModelId(model.id);
                        saveChatModelAsCookie(model.id);
                      });
                    }}
                    className="gap-4 group/item flex flex-row justify-between items-center cursor-pointer"
                    disabled={model.status !== 'enabled'}
                    data-active={model.id === optimisticModelId}
                  >
                    <div className="flex flex-row gap-3 items-center">
                      <Image src={model.icon.light} alt={model.label} width={30} height={30} className="dark:hidden h-[30px]" />
                      <Image src={model.icon.dark} alt={model.label} width={30} height={30} className="hidden dark:block h-[30px]" />

                      <div className="flex flex-col gap-1 items-start">
                        {model.label}
                        {model.description && (
                          <div className="text-xs text-muted-foreground">
                            {model.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-primary dark:text-primary-foreground opacity-0 group-data-[active=true]/item:opacity-100">
                      <CheckCircleFillIcon />
                    </div>

                    {model.status === 'coming-soon' && (
                      <DropdownMenuShortcut>به زودی...</DropdownMenuShortcut>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>

              {index < modelGroups.length - 1 && <DropdownMenuSeparator/>}
            </React.Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    ), [modelGroups, open]
  );
}
