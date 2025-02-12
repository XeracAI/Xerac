import * as crypto from 'crypto'

const OTPAllowedChars = '0123456789'

export const generate = async () => {
	let password = ''
	while (password.length < 5) {
		const charIndex = crypto.randomInt(0, OTPAllowedChars.length)
		if (password.length === 0 && OTPAllowedChars[charIndex] === '0') {
			continue
		}
		password += OTPAllowedChars[charIndex]
	}
	return password
}
