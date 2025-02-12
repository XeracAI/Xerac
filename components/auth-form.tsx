'use client';

import { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';

import { Input } from './ui/input';
import { Label } from './ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './ui/input-otp';
import { SubmitButton } from '@/components/submit-button';
import { phoneSchema, passwordSchema, nameSchema } from '@/lib/validations';

export function AuthForm({
  action,
  defaultPhone = '',
  step = 'phone',
  setStep,
}: {
  action: (formData: FormData) => Promise<boolean>;
  defaultPhone?: string;
  step: 'phone' | 'otp' | 'password-set' | 'name-set' | 'password';
  setStep: (value: 'phone' | 'otp' | 'password-set' | 'name-set' | 'password') => void;
}) {
  const [phone, setPhone] = useState(defaultPhone);
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (defaultPhone) {
      setPhone(defaultPhone);
    }
  }, [defaultPhone]);

  const validatePhone = (value: string) => {
    try {
      phoneSchema.parse({ phone: value });
      setErrors(prev => ({ ...prev, phone: '' }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, phone: error.errors[0].message }));
      }
      return false;
    }
  };

  const validatePassword1 = (password1: string) => {
    try {
      passwordSchema.parse({ password: password1 });
      setErrors(prev => ({ ...prev, password1: '' }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, password1: error.errors[0].message }));
      }
      return false;
    }
  };

  const validatePassword2 = (password1: string, password2: string) => {
    if (password1 !== password2) {
      setErrors(prev => ({ ...prev, password2: 'رمز عبور و تکرار آن باید یکسان باشند' }));
      return false;
    }
    setErrors(prev => ({ ...prev, password2: '' }));
    return true;
  };

  const validateNames = (firstName: string, lastName: string) => {
    try {
      nameSchema.parse({ firstName, lastName });
      setErrors(prev => ({ ...prev, firstName: '', lastName: '' }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          setErrors(prev => ({ ...prev, [err.path[0]]: err.message }));
        });
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (step === 'phone') {
      if (!validatePhone(formData.get('phone') as string)) {
        return;
      }
    } else if (step === 'password-set') {
      if (!validatePassword1(
        formData.get('password1') as string
      ) || !validatePassword2(
        formData.get('password1') as string,
        formData.get('password2') as string
      )) {
        return;
      }
    } else if (step === 'name-set') {
      if (!validateNames(
        formData.get('firstName') as string,
        formData.get('lastName') as string
      )) {
        return;
      }
    }

    setIsLoading(true);
    try {
      setIsLoading(await action(formData));
    } catch (e) {
      console.error(`Failed to authenticate user: ${e}`);
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
                className={`bg-muted text-md md:text-sm ltr ${errors.phone ? 'border-red-500' : ''}`}
                type="tel"
                dir="ltr"
                placeholder="09123456789"
                autoComplete="tel"
                required
                autoFocus
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  validatePhone(e.target.value);
                }}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone}</p>
              )}
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
                  id="otp"
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

              <div className="relative">
                <Input
                  id="password1"
                  name="password1"
                  className={`bg-muted text-md md:text-sm ${errors.password1 ? 'border-red-500' : ''}`}
                  type={showPassword1 ? "text" : "password"}
                  required
                  autoFocus
                  onChange={(e) => validatePassword1(e.target.value) && validatePassword2(e.target.value, formRef.current?.password2.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword1(!showPassword1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword1 ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password1 && (
                <p className="text-sm text-red-500">{errors.password1}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="password2"
                className="text-zinc-600 font-normal dark:text-zinc-400"
              >
                تکرار رمز عبور
              </Label>

              <div className="relative">
                <Input
                  id="password2"
                  name="password2"
                  className="bg-muted text-md md:text-sm"
                  type={showPassword2 ? "text" : "password"}
                  required
                  onChange={(e) => validatePassword2(formRef.current?.password1.value, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword2(!showPassword2)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword2 ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password2 && (
                <p className="text-sm text-red-500">{errors.password2}</p>
              )}
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
                className={`bg-muted text-md md:text-sm ltr ${errors.firstName ? 'border-red-500' : ''}`}
                placeholder="نام"
                required
                autoFocus
                onChange={(e) => validateNames(e.target.value, formRef.current?.lastName.value)}
              />
              {errors.firstName && (
                <p className="text-sm text-red-500">{errors.firstName}</p>
              )}
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
              {errors.lastName && (
                <p className="text-sm text-red-500">{errors.lastName}</p>
              )}
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

              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  className="bg-muted text-md md:text-sm"
                  type={showPassword ? "text" : "password"}
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
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
