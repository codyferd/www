export interface CustomAttribute {
	id: string;
	key: string;
	value: string;
}

export interface Contact {
	id: string;
	name: string;
	phoneNumber: string;
	email: string;
	birthdate: string;
	address: string;
	customAttributes: CustomAttribute[];
	createdAt: number;
}

export const INITIAL_CONTACTS: Contact[] = [];
