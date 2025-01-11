'use client';

import { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { Input } from './ui/input';
import { Label } from './ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './ui/input-otp';
import { SubmitButton } from '@/components/submit-button';

export function AuthForm({
  action,
  defaultPhone = '',
  step = 'phone',
  setStep,
}: {
  action: (formData: FormData) => Promise<void>;
  defaultPhone?: string;
  step: 'phone' | 'otp' | 'password-set' | 'name-set' | 'password';
  setStep: (value: 'phone' | 'otp' | 'password-set' | 'name-set' | 'password') => void;
}) {
  const [phone, setPhone] = useState(defaultPhone);
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (defaultPhone) {
      setPhone(defaultPhone);
    }
  }, [defaultPhone]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      await action(formData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 sm:px-16 relative">
      <AnimatePresence mode="wait">
        {step === 'phone' ? (
          <motion.div
            key="phone"
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="phone"
                className="text-zinc-600 font-normal dark:text-zinc-400"
              >
                شماره موبایل
              </Label>

              <Input
                id="phone"
                name="phone"
                className="bg-muted text-md md:text-sm ltr"
                type="tel"
                dir="ltr"
                placeholder="09123456789"
                autoComplete="tel"
                required
                autoFocus
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <SubmitButton isLoading={isLoading}>
              {isLoading ? 'در حال پردازش...' : 'ادامه'}
            </SubmitButton>
          </motion.div>
        ) : step === 'otp' ? (
          <motion.div
            key="otp"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            <Input type="hidden" name="phone" value={phone} />
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                ویرایش
              </button>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 ltr">
                {phone}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="otp"
                className="text-zinc-600 font-normal dark:text-zinc-400"
              >
                کد تایید
              </Label>

              <div style={{direction: 'ltr'}} className='flex justify-center'>
                <InputOTP
                  maxLength={5}
                  name="otp"
                  autoFocus
                  onComplete={() => formRef.current?.requestSubmit()}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <SubmitButton isLoading={isLoading}>
              {isLoading ? 'در حال پردازش...' : 'تایید'}
            </SubmitButton>
          </motion.div>
        ) : step === 'password-set' ? (
          <motion.div
            key="password-set"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            <Input type="hidden" name="phone" value={phone} />
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                ویرایش
              </button>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 ltr">
                {phone}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="password1"
                className="text-zinc-600 font-normal dark:text-zinc-400"
              >
                رمز عبور
              </Label>

              <Input
                id="password1"
                name="password1"
                className="bg-muted text-md md:text-sm"
                type="password"
                required
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="password2"
                className="text-zinc-600 font-normal dark:text-zinc-400"
              >
                تکرار رمز عبور
              </Label>

              <Input
                id="password2"
                name="password2"
                className="bg-muted text-md md:text-sm"
                type="password"
                required
              />
            </div>

            <SubmitButton isLoading={isLoading}>
              {isLoading ? 'در حال پردازش...' : 'تایید'}
            </SubmitButton>
          </motion.div>
        ) : step === 'name-set' ? (
          <motion.div
            key="name"
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            <Input type="hidden" name="phone" value={phone} />

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="firstName"
                className="text-zinc-600 font-normal dark:text-zinc-400"
              >
                نام
              </Label>

              <Input
                id="firstName"
                name="firstName"
                className="bg-muted text-md md:text-sm ltr"
                placeholder="نام"
                required
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="lastName"
                className="text-zinc-600 font-normal dark:text-zinc-400"
              >
                نام خانوادگی
              </Label>

              <Input
                id="lastName"
                name="lastName"
                className="bg-muted text-md md:text-sm ltr"
                placeholder="نام خانوادگی"
                required
              />
            </div>

            <SubmitButton isLoading={isLoading}>
              {isLoading ? 'در حال پردازش...' : 'ادامه'}
            </SubmitButton>
          </motion.div>
        ) : (
          <motion.div
            key="password"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            <Input type="hidden" name="phone" value={phone} />
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                ویرایش
              </button>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 ltr">
                {phone}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="password"
                className="text-zinc-600 font-normal dark:text-zinc-400"
              >
                رمز عبور
              </Label>

              <Input
                id="password"
                name="password"
                className="bg-muted text-md md:text-sm"
                type="password"
                required
                autoFocus
              />
            </div>

            <SubmitButton isLoading={isLoading}>
              {isLoading ? 'در حال پردازش...' : 'تایید'}
            </SubmitButton>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
