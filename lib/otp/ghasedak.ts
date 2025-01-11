import 'server-only'

import * as crypto from 'crypto'

const ghasedakAPIKey = process.env.GHASEDAK_API_KEY
if (!ghasedakAPIKey) {
  throw Error('Ghasedak API key is required!')
}
const ghasedakTemplateName = process.env.GHASEDAK_TEMPLATE_NAME
if (!ghasedakAPIKey) {
  throw Error('Ghasedak template name is required!')
}
const ghasedakVerificationPath = 'https://api.ghasedak.me/v2/sms/send/verification?agent=node'

const allowedChars = '0123456789'

export const generateOTP = async () => {
  let password = ''
  while (password.length < 5) {
    const charIndex = crypto.randomInt(0, allowedChars.length)
    if (password.length === 0 && allowedChars[charIndex] === '0') {
      continue
    }
    password += allowedChars[charIndex]
  }
  return password
}

export const sendSMS = async (phoneNumber: string, otp: string) => {
  // await fetch(ghasedakVerificationPath, {
  //   method: 'POST',
  //   body: `receptor=${phoneNumber}&type=1&template=${ghasedakTemplateName}&param1=${otp}`,
  //   headers: {
  //     Accept: 'application/json',
  //     'Content-Type': 'application/x-www-form-urlencoded',
  //     charset: 'utf-8',
  //     apikey: ghasedakAPIKey,
  //   },
  // })
}
