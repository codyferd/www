import * as OTPAuth from 'otpauth';

export interface AuthenticatorToken {
	id: string;
	issuer: string;
	secret: string;
	liveCode: string;
}

/**
 * STANDARD TOTP GENERATION LOGIC (RFC 6238)
 */
export const computeVerificationToken = (secretString: string): string => {
	try {
		if (!secretString) return '000000';

		const cleanSecret = secretString.replace(/[\s-]/g, '').toUpperCase();
		if (cleanSecret.length === 0) return '000000';

		const totpInstance = new OTPAuth.TOTP({
			issuer: 'Avero',
			label: 'Core Node',
			algorithm: 'SHA1',
			digits: 6,
			period: 30,
			secret: OTPAuth.Secret.fromBase32(cleanSecret)
		});

		return totpInstance.generate();
	} catch (e) {
		console.error('Cryptographic evaluation error:', e);
		return '000000';
	}
};

export const formatTokenDigits = (codeString: string): string => {
	if (!codeString || codeString.length !== 6) return codeString;
	return `${codeString.slice(0, 3)} ${codeString.slice(3)}`;
};
