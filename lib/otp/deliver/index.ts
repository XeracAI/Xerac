import 'server-only';

import * as ghasedak from './ghasedak';
import * as console from './console';

const provider = process.env.OTP_PROVIDER || 'console';

if (!['ghasedak', 'console'].includes(provider)) {
  throw new Error(`Invalid OTP provider: ${provider}. Valid options are: ghasedak, console`);
}

export const sendSMS = async (phoneNumber: string, otp: string) => {
  switch (provider) {
    case 'ghasedak':
      return ghasedak.sendSMS(phoneNumber, otp);
    case 'console':
      return console.sendSMS(phoneNumber, otp);
    default:
      throw new Error(`Unhandled OTP provider: ${provider}`);
  }
};
