'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes'

import { AuthForm } from '@/components/auth-form';
import { authenticate } from '../actions';

export default function Page() {
  const {setTheme, theme} = useTheme();
  const router = useRouter();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'password-set' | 'name-set' | 'password'>('phone');

  const handleSubmit = async (formData: FormData) => {
    try {
      setPhoneNumber(formData.get('phone') as string);

      const result = await authenticate(formData);

      switch (result.status) {
        case 'invalid_data':
          toast.error('اطلاعات وارد شده معتبر نیست!');
          break;
        case 'user_not_found':
          toast.error('کاربر پیدا نشد!');
          break;
        case 'failed':
          toast.error('بررسی اطلاعات حساب کاربری با خطا مواجه شد!');
          break;
        case 'wait':
          toast.warning('به دلیل وارد کردن مکرر کد تایید اشتباه، حساب شما 3 دقیقه قفل شده. لطفا بعدا دوباره تلاش کنید.')
        case 'needs_verification':
          setStep("otp");
          toast.info('کد تایید به شماره موبایل شما ارسال شد');
          break;
        case 'needs_password_set':
          setStep("password-set");
          toast.info('لطفا یک رمز عبور جدید برای خود تعیین کنید');
          break;
        case 'needs_name_set':
          setStep("name-set");
          break;
        case 'expired_otp':
          toast.error('کد تایید منقضی شده است!');
          break;
        case 'invalid_otp':
          toast.error('کد تایید نامعتبر است!');
          break;
        case 'in_progress':
          setStep("password");
          break;
        case 'success':
          router.push('/chat')
          router.refresh();
          return true;
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      toast.error('خطایی رخ داد. لطفا دوباره تلاش کنید.');
    }
    return false;
  };

  const getTitleText = () => {
    switch (step) {
      case 'otp':
        return 'کد تایید';
      case 'password-set':
        return 'تعیین رمز عبور';
      case 'name-set':
        return 'تکمیل اطلاعات';
      case 'password':
        return 'ورود';
      default:
        return 'ورود / ثبت نام';
    }
  };

  const getDescriptionText = () => {
    switch (step) {
      case 'otp':
        return 'کد تایید ارسال شده به شماره موبایل خود را وارد کنید';
      case 'password-set':
        return 'لطفا یک رمز عبور برای حساب کاربری خود تعیین کنید';
      case 'name-set':
        return 'لطفا نام خود را وارد کنید';
      case 'password':
        return 'رمز عبور خود را وارد کنید';
      default:
        return 'برای ورود یا ثبت نام شماره موبایل خود را وارد کنید';
    }
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">{getTitleText()}</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            {getDescriptionText()}
          </p>
        </div>
        <AuthForm 
          action={handleSubmit} 
          defaultPhone={phoneNumber}
          step={step}
          setStep={setStep}
        />
      </div>

      <button
        className="hidden md:flex fixed py-3 px-4 h-fit md:h-[34px] order-5 md:mr-auto theme left-0 top-0"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" className="size-6">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
          />
        </svg>
      </button>
    </div>
  );
}
