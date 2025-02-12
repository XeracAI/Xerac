import 'server-only';

import * as cryptoRandom from './cryptoRandom';
import * as staticOTP from './static';

const generationMethod = process.env.OTP_GENERATION_METHOD || 'crypto';

if (!['crypto', 'static'].includes(generationMethod)) {
  throw new Error(`Invalid OTP generation method: ${generationMethod}. Valid options are: crypto, static`);
}

export const generateOTP = async () => {
  switch (generationMethod) {
    case 'crypto':
      return cryptoRandom.generate();
    case 'static':
      return staticOTP.generate();
    default:
      throw new Error(`Unhandled OTP generation method: ${generationMethod}`);
  }
};
