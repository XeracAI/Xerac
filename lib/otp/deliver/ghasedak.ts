import 'server-only'

const ghasedakAPIKey = process.env.GHASEDAK_API_KEY
const ghasedakTemplateName = process.env.GHASEDAK_TEMPLATE_NAME

// Only validate these when Ghasedak is the selected provider
if (process.env.OTP_PROVIDER === 'ghasedak') {
  if (!ghasedakAPIKey) {
    throw Error('Ghasedak API key is required when using Ghasedak provider!')
  }
  if (!ghasedakTemplateName) {
    throw Error('Ghasedak template name is required when using Ghasedak provider!')
  }
}

const ghasedakVerificationPath = 'https://api.ghasedak.me/v2/sms/send/verification?agent=node'

export const sendSMS = async (phoneNumber: string, otp: string) => {
  const response = await fetch(ghasedakVerificationPath, {
    method: 'POST',
    body: `receptor=${phoneNumber}&type=1&template=${ghasedakTemplateName}&param1=${otp}`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      charset: 'utf-8',
      apikey: ghasedakAPIKey!,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to send SMS: ${response.statusText}`);
  }

  return response;
}
