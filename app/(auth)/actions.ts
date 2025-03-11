'use server';

import { z } from 'zod';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { headers } from 'next/headers';

import { createUser, updateUserVerification, updateUserPassword, updateUserOTP, getUserWithAllFields, updateUserFailedTries, updateUserInfo, getUserByReferralCode } from '@/lib/db/queries';
import { auth, signIn } from './auth';
import { generateOTP } from '@/lib/otp/generate';
import { sendSMS } from '@/lib/otp/deliver';
import { compareSync } from 'bcrypt-ts';
import { trackUserEvent } from '@/lib/analytics';
import { getUserAnalyticsFromHeaders } from '@/lib/analytics/middleware';

const phoneSchema = z.object({
  phone: z.string().transform((val) => parsePhoneNumberFromString(val, 'IR')).refine((val) => val?.isValid() ?? false, 'شماره موبایل نامعتبر است'),
});

const otpSchema = z.object({
  otp: z.string().length(5),
});

const passwordSchema = z.object({
  password: z.string().min(6),
});

const nameSchema = z.object({
  firstName: z.string().max(50),
  lastName: z.string().max(50),
  referralCode: z.string().max(10).nullish(),
});

export interface AuthActionState {
  status: 
    | 'idle'
    | 'in_progress' 
    | 'success'
    | 'failed'
    | 'user_not_found'
    | 'invalid_data'
    | 'needs_verification'
    | 'needs_password_set'
    | 'needs_name_set'
    | 'wait'
    | 'invalid_otp'
    | 'expired_otp';
}

export async function authenticate(formData: FormData): Promise<AuthActionState> {
  try {
    const session = await auth();

    // Get analytics data from headers
    const headersList = await headers();
    const analyticsData = getUserAnalyticsFromHeaders(headersList);

    const phone = formData.get('phone') as string;
    const otp = formData.get('otp') as string;
    const password = formData.get('password') as string;
    const password1 = formData.get('password1') as string;
    const password2 = formData.get('password2') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const referralCode = formData.get('referralCode') as string;

    if (!phone) return { status: 'idle' };
    const validatedPhone = phoneSchema.parse({ phone });
    const phoneNumber = validatedPhone.phone!;
    let user = await getUserWithAllFields(phoneNumber.nationalNumber, phoneNumber.countryCallingCode);

    // First validate phone
    if (!otp && !password && !password1 && !password2 && !firstName && !lastName && !referralCode) {
      // If user doesn't exist, create a new unverified user
      if (!user) {
        user = await createUser({
          phoneNumber: phoneNumber.nationalNumber,
          countryCode: phoneNumber.countryCallingCode,
        });

        // Track signup event
        await trackUserEvent({
          userId: user.id,
          eventType: 'signup',
          deviceInfo: analyticsData.deviceInfo,
          osInfo: analyticsData.osInfo,
          browserInfo: analyticsData.browserInfo,
          ipAddress: analyticsData.ipAddress,
          properties: {
            source: analyticsData.referrer || 'direct'
          }
        });
      }

      // If user's phone is not verified, newly created or has not set their password yet, send OTP
      if (!user.isPhoneNumberVerified || !user.password) {
        if ((user.lastSMSSent && Date.now() - user.lastSMSSent.getTime() < 160000) || (user.lockedUntil && new Date() < user.lockedUntil)) {
          return { status: 'wait' }
        }

        const otp = await generateOTP();
        await Promise.all([
          sendSMS(phoneNumber.number, otp),
          updateUserOTP(user.id, otp, new Date(Date.now() + 300000)),
        ]);

        // Track OTP request event
        await trackUserEvent({
          userId: user.id,
          eventType: 'otp_request',
          deviceInfo: analyticsData.deviceInfo,
          osInfo: analyticsData.osInfo,
          browserInfo: analyticsData.browserInfo,
          ipAddress: analyticsData.ipAddress,
        });

        return { status: 'needs_verification' };
      }

      return { status: 'in_progress' };
    }

    if (user === null) {
      return { status: 'user_not_found' }
    }

    // Then validate OTP if needed
    if (otp && !password) {
      otpSchema.parse({ otp });

      // Return error if phone is already verified or otp is incorrect
      if (user.isPhoneNumberVerified && user.password) {
        return { status: 'invalid_data' }
      }

      // Return error if OTP is expired
      if (user.otpExpires && new Date() > user.otpExpires) {
        return { status: 'expired_otp' }
      }

      // Return error and increase fails if OTP is wrong
      if (user.otp !== otp) {
        await updateUserFailedTries(user.id, user.failedTries + 1, user.failedTries === 3 ? new Date(Date.now() + 900000) : undefined)
        return { status: 'invalid_otp' }
      }

      await updateUserVerification(user.id, true);

      await signIn('credentials', {
        phoneNumber: user.phoneNumber, countryCode: user.countryCode,
        redirect: false
      });

      return { status: !user.password ? 'needs_password_set' : (!user.firstName || !user.lastName) ? 'needs_name_set' : 'in_progress' };
    }

    if (password1 && password2) {
      if (!session || !session.user || session.user.id !== user.id) {
        return { status: 'failed' }
      }

      passwordSchema.parse({ password: password1 });
      if (password1 !== password2) {
        return { status: 'invalid_data' }
      }

      await updateUserPassword(user.id, password1);

      // Track password change event
      await trackUserEvent({
        userId: user.id,
        eventType: 'password_change',
        deviceInfo: analyticsData.deviceInfo,
        osInfo: analyticsData.osInfo,
        browserInfo: analyticsData.browserInfo,
        ipAddress: analyticsData.ipAddress,
      });

      return { status: (!user.firstName || !user.lastName) ? 'needs_name_set' : 'success' }
    }

    if (firstName && lastName) {
      if (!session || !session.user || session.user.id !== user.id) {
        return { status: 'failed' }
      }

      nameSchema.parse({ firstName, lastName, referralCode })
      let referrer
      if (referralCode) {
        const referrerUser = await getUserByReferralCode(referralCode)
        if (referrerUser === null || (user.referrer && user.referrer === referrerUser.id)) {
          return { status: 'invalid_data' }
        }

        referrer = referrerUser.id

        // Track referral used event
        await trackUserEvent({
          userId: user.id,
          eventType: 'referral_used',
          properties: {
            referralCode,
            referrerId: referrer
          }
        });

        // Track referral created event for the referrer
        await trackUserEvent({
          userId: referrer,
          eventType: 'referral_created',
          properties: {
            referredUserId: user.id
          }
        });
      }

      await updateUserInfo(user.id, firstName, lastName, referrer)

      // Track profile update event
      await trackUserEvent({
        userId: user.id,
        eventType: 'profile_update',
        deviceInfo: analyticsData.deviceInfo,
        osInfo: analyticsData.osInfo,
        browserInfo: analyticsData.browserInfo,
        ipAddress: analyticsData.ipAddress,
        properties: {
          fieldsUpdated: ['firstName', 'lastName']
        }
      });

      await signIn('credentials', {
        phoneNumber: user.phoneNumber, countryCode: user.countryCode,
        redirect: false
      });

      return { status: 'success' }
    }

    // Validate and check password
    passwordSchema.parse({ password });
    const passwordsMatch = compareSync(password, user.password!);
    if (!passwordsMatch) {
      return { status: 'invalid_data' };
    }

    await signIn('credentials', {
      phoneNumber: user.phoneNumber, countryCode: user.countryCode,
      redirect: false,
    });

    // Track login event
    await trackUserEvent({
      userId: user.id,
      eventType: 'login',
      deviceInfo: analyticsData.deviceInfo,
      osInfo: analyticsData.osInfo,
      browserInfo: analyticsData.browserInfo,
      ipAddress: analyticsData.ipAddress,
    });

    return { status: (!user.firstName || !user.lastName) ? 'needs_name_set' : 'success' };
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }
    return { status: 'failed' };
  }
}
