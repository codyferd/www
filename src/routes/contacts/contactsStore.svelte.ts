import { INITIAL_CONTACTS, type Contact, type CustomAttribute } from './types';

class ContactsStore {
	contacts = $state<Contact[]>([]);
	searchQuery = $state('');
	selectedContactId = $state<string | null>(null);
	isEditing = $state(false);

	// Form state for creating/editing
	formName = $state('');
	formPhone = $state('');
	formEmail = $state('');
	formBirthdate = $state('');
	formAddress = $state('');
	formAttributes = $state<CustomAttribute[]>([]);

	constructor() {
		this.loadFromStorage();
	}

	private loadFromStorage() {
		if (typeof window === 'undefined') {
			this.contacts = INITIAL_CONTACTS;
			return;
		}
		const saved = localStorage.getItem('avero_contacts_data');
		if (saved) {
			try {
				this.contacts = JSON.parse(saved);
			} catch {
				this.contacts = INITIAL_CONTACTS;
			}
		} else {
			this.contacts = INITIAL_CONTACTS;
			this.saveToStorage();
		}
	}

	private saveToStorage() {
		if (typeof window !== 'undefined') {
			localStorage.setItem('avero_contacts_data', JSON.stringify(this.contacts));
		}
	}

	get filteredContacts() {
		if (!this.searchQuery.trim()) return this.contacts;
		const q = this.searchQuery.toLowerCase();
		return this.contacts.filter(
			(c) =>
				c.name.toLowerCase().includes(q) ||
				c.email.toLowerCase().includes(q) ||
				c.phoneNumber.toLowerCase().includes(q) ||
				c.address.toLowerCase().includes(q) ||
				c.customAttributes.some(
					(a) => a.key.toLowerCase().includes(q) || a.value.toLowerCase().includes(q)
				)
		);
	}

	get selectedContact() {
		return this.contacts.find((c) => c.id === this.selectedContactId) || null;
	}

	selectContact(contact: Contact | null) {
		if (!contact) {
			this.selectedContactId = null;
			this.isEditing = false;
			this.clearForm();
			return;
		}
		this.selectedContactId = contact.id;
		this.isEditing = false;
		this.formName = contact.name;
		this.formPhone = contact.phoneNumber;
		this.formEmail = contact.email;
		this.formBirthdate = contact.birthdate;
		this.formAddress = contact.address;
		this.formAttributes = JSON.parse(JSON.stringify(contact.customAttributes));
	}

	startNewContact() {
		this.selectedContactId = null;
		this.isEditing = true;
		this.clearForm();
	}

	clearForm() {
		this.formName = '';
		this.formPhone = '';
		this.formEmail = '';
		this.formBirthdate = '';
		this.formAddress = '';
		this.formAttributes = [];
	}

	addAttribute() {
		this.formAttributes.push({
			id: 'attr-' + Math.random().toString(36).substring(2, 9),
			key: '',
			value: ''
		});
	}

	removeAttribute(id: string) {
		this.formAttributes = this.formAttributes.filter((a) => a.id !== id);
	}

	saveContact() {
		if (!this.formName.trim()) return;

		if (this.selectedContactId) {
			// Update existing
			this.contacts = this.contacts.map((c) => {
				if (c.id === this.selectedContactId) {
					return {
						...c,
						name: this.formName,
						phoneNumber: this.formPhone,
						email: this.formEmail,
						birthdate: this.formBirthdate,
						address: this.formAddress,
						customAttributes: [...this.formAttributes]
					};
				}
				return c;
			});
		} else {
			// Create new
			const newContact: Contact = {
				id: 'c-' + Math.random().toString(36).substring(2, 9),
				name: this.formName,
				phoneNumber: this.formPhone,
				email: this.formEmail,
				birthdate: this.formBirthdate,
				address: this.formAddress,
				customAttributes: [...this.formAttributes],
				createdAt: Date.now()
			};
			this.contacts.unshift(newContact);
			this.selectedContactId = newContact.id;
		}

		this.isEditing = false;
		this.saveToStorage();
	}

	deleteContact(id: string) {
		this.contacts = this.contacts.filter((c) => c.id !== id);
		if (this.selectedContactId === id) {
			this.selectedContactId = null;
			this.isEditing = false;
		}
		this.saveToStorage();
	}

	exportJSON() {
		const dataStr =
			'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.contacts, null, 2));
		const downloadAnchor = document.createElement('a');
		downloadAnchor.setAttribute('href', dataStr);
		downloadAnchor.setAttribute('download', `avero_contacts_${Date.now()}.json`);
		document.body.appendChild(downloadAnchor);
		downloadAnchor.click();
		downloadAnchor.remove();
	}

	importJSON(file: File) {
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const content = e.target?.result as string;
				const parsed = JSON.parse(content);
				if (Array.isArray(parsed)) {
					this.contacts = parsed;
					this.saveToStorage();
					this.selectContact(null);
				}
			} catch (err) {
				console.error('Failed to parse contacts JSON', err);
				alert('Invalid JSON file format for contacts.');
			}
		};
		reader.readAsText(file);
	}
}

export const contactsStore = new ContactsStore();
