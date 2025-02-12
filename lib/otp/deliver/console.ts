import 'server-only'

export const sendSMS = async (phoneNumber: string, otp: string) => {
  console.log(`OTP for phone number ${phoneNumber} is: ${otp}`);
}
