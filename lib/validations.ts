import { z } from 'zod';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

export const phoneSchema = z.object({
  phone: z.string().transform((val) => parsePhoneNumberFromString(val, 'IR')).refine((val) => val?.isValid() ?? false, 'شماره موبایل نامعتبر است'),
});

export const otpSchema = z.object({
  otp: z.string().length(5, 'کد تایید باید ۵ رقم باشد'),
});

export const passwordSchema = z.object({
  password: z.string().min(6, 'رمز عبور باید حداقل ۶ کاراکتر باشد'),
});

export const nameSchema = z.object({
  firstName: z.string().min(1, 'نام الزامی است').max(50, 'نام نمی‌تواند بیشتر از ۵۰ کاراکتر باشد'),
  lastName: z.string().min(1, 'نام خانوادگی الزامی است').max(50, 'نام خانوادگی نمی‌تواند بیشتر از ۵۰ کاراکتر باشد'),
});
