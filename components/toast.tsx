'use client';

import React, { ReactNode } from 'react';
import { toast as sonnerToast, Toaster as SonnerToaster, type ToasterProps } from 'sonner';
import { CheckCircleFillIcon, InfoIcon, WarningIcon } from './icons';
import { useTheme } from "next-themes";

const iconsByType: Record<'success' | 'info' | 'error', ReactNode> = {
  success: <CheckCircleFillIcon />,
  info: <InfoIcon />,
  error: <WarningIcon />,
};

export function toast(props: Omit<ToastProps, 'id'>) {
  return sonnerToast.custom((id) => (
    <Toast id={id} type={props.type} description={props.description} />
  ));
}

function Toast(props: ToastProps) {
  const { id, type, description } = props;

  return (
    <div className="flex w-full toast-mobile:w-[356px] justify-center">
      <div
        data-testid="toast"
        key={id}
        className="bg-zinc-100 dark:bg-zinc-900 p-3 rounded-lg w-full toast-mobile:w-fit flex flex-row gap-2 items-center"
      >
        <div
          data-type={type}
          className="data-[type=error]:text-red-600 data-[type=success]:text-green-600 data-[type=info]:text-blue-500"
        >
          {iconsByType[type]}
        </div>
        <div className="text-zinc-950 dark:text-zinc-50 text-sm">{description}</div>
      </div>
    </div>
  );
}

interface ToastProps {
  id: string | number;
  type: 'success' | 'info' | 'error';
  description: string;
}

export function Toaster() {
  const { resolvedTheme } = useTheme();

  return <SonnerToaster position="top-center" toastOptions={{ style: { fontFamily: "Shabnam, ui-sans-serif, system-ui, -apple-system" } }} closeButton theme={resolvedTheme as ToasterProps['theme']} />;
}
