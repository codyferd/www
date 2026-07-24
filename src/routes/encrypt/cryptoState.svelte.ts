export class CryptoState {
	// App Operational States
	operationMode = $state<'encrypt' | 'decrypt'>('encrypt');
	payloadType = $state<'text' | 'file'>('text');
	passphrase = $state('');
	showPassword = $state(false);
	isProcessing = $state(false);
	statusMessage = $state('');

	// Pipeline Data Buffers
	textInput = $state('');
	fileInput = $state<File | null>(null);
	textOutput = $state('');
	isDragging = $state(false);

	// Immutable Cryptographic Core Constraints
	private readonly CRYPTO_SALT = new Uint8Array([
		86, 12, 99, 23, 104, 56, 11, 89, 43, 21, 90, 77, 34, 112, 9, 65
	]);
	private readonly PBKDF2_ITERATIONS = 100000;

	// Computed state validation logic properties
	hasInputContent = $derived.by(() => {
		return this.payloadType === 'text' ? this.textInput.length > 0 : this.fileInput !== null;
	});

	setOperationMode(mode: 'encrypt' | 'decrypt') {
		this.operationMode = mode;
		this.textOutput = '';
		this.statusMessage = '';
	}

	setPayloadType(type: 'text' | 'file') {
		this.payloadType = type;
		this.clearInputSource();
	}

	clearInputSource() {
		this.textInput = '';
		this.fileInput = null;
		this.textOutput = '';
		this.statusMessage = '';
	}

	resetWorkspace() {
		this.passphrase = '';
		this.clearInputSource();
	}

	// High-Performance Cryptographic Key Derivation Process
	private async deriveKey(rawPassword: string): Promise<CryptoKey> {
		// Normalize unicode and replace mobile smart quotes / dashes with ASCII counterparts
		const cleanPassword = rawPassword
			.normalize('NFC')
			.replace(/[\u201C\u201D]/g, '"')
			.replace(/[\u2018\u2019]/g, "'")
			.replace(/\u2014/g, '--');

		const encoder = new TextEncoder();
		const passwordBuffer = encoder.encode(cleanPassword);

		const baseKey = await window.crypto.subtle.importKey(
			'raw',
			passwordBuffer,
			{ name: 'PBKDF2' },
			false,
			['deriveBits', 'deriveKey']
		);

		return await window.crypto.subtle.deriveKey(
			{
				name: 'PBKDF2',
				salt: this.CRYPTO_SALT,
				iterations: this.PBKDF2_ITERATIONS,
				hash: 'SHA-256'
			},
			baseKey,
			{ name: 'AES-GCM', length: 256 },
			false,
			['encrypt', 'decrypt']
		);
	}

	// Execution Route Router Matrix Orchestrator
	async processCryptographicPayload() {
		if (!this.passphrase) return;
		this.isProcessing = true;
		this.textOutput = '';
		this.statusMessage = 'Initializing processing nodes...';

		try {
			const cryptoKey = await this.deriveKey(this.passphrase);

			if (this.payloadType === 'text') {
				if (this.operationMode === 'encrypt') {
					await this.runTextEncryption(cryptoKey);
				} else {
					await this.runTextDecryption(cryptoKey);
				}
			} else {
				if (this.operationMode === 'encrypt') {
					await this.runFileEncryption(cryptoKey);
				} else {
					await this.runFileDecryption(cryptoKey);
				}
			}
		} catch (err) {
			console.error(err);
			this.statusMessage = '⚠️ Fatal Error: Verification signature matching failed.';
		} finally {
			this.isProcessing = false;
		}
	}

	// Safe Base64 Encoding for Mobile Engines
	private uint8ToBase64(bytes: Uint8Array): string {
		let binary = '';
		const len = bytes.byteLength;
		const chunkSize = 0x8000; // 32KB chunk limit to prevent stack overflow on iOS/Android
		for (let i = 0; i < len; i += chunkSize) {
			binary += String.fromCharCode.apply(
				null,
				bytes.subarray(i, Math.min(i + chunkSize, len)) as unknown as number[]
			);
		}
		return btoa(binary);
	}

	// Text Block Arrays Encryption Pipeline
	private async runTextEncryption(cryptoKey: CryptoKey) {
		if (!this.textInput) {
			this.statusMessage = 'No payload provided.';
			return;
		}

		const encoder = new TextEncoder();
		const dataBuffer = encoder.encode(this.textInput);
		const iv = window.crypto.getRandomValues(new Uint8Array(12));

		const cipherBuffer = await window.crypto.subtle.encrypt(
			{ name: 'AES-GCM', iv: iv },
			cryptoKey,
			dataBuffer
		);

		const combinedResult = new Uint8Array(iv.length + cipherBuffer.byteLength);
		combinedResult.set(iv, 0);
		combinedResult.set(new Uint8Array(cipherBuffer), iv.length);

		// Safe for mobile call stacks
		this.textOutput = this.uint8ToBase64(combinedResult);
		this.statusMessage = '✓ Text payload successfully encrypted.';
	}

	// Text Block Arrays Decryption Pipeline
	private async runTextDecryption(cryptoKey: CryptoKey) {
		if (!this.textInput) {
			this.statusMessage = 'No data to read.';
			return;
		}

		try {
			// Strip whitespace and smart quotes/dashes from pasted base64 strings
			const cleanedInput = this.textInput.trim().replace(/\s+/g, '');
			const binaryString = atob(cleanedInput);

			const combinedBuffer = new Uint8Array(binaryString.length);
			for (let i = 0; i < binaryString.length; i++) {
				combinedBuffer[i] = binaryString.charCodeAt(i);
			}

			if (combinedBuffer.length < 13) {
				this.statusMessage = '⚠️ Error: Encrypted payload is too short.';
				return;
			}

			// Force explicit ArrayBuffer slices so Mobile WebCrypto evaluates correct offsets
			const iv = new Uint8Array(combinedBuffer.buffer.slice(0, 12));
			const ciphertext = new Uint8Array(combinedBuffer.buffer.slice(12));

			const plainBuffer = await window.crypto.subtle.decrypt(
				{ name: 'AES-GCM', iv: iv },
				cryptoKey,
				ciphertext
			);

			const decoder = new TextDecoder();
			this.textOutput = decoder.decode(plainBuffer);
			this.statusMessage = '✓ Text payload decipher decrypted.';
		} catch (err) {
			console.error(err);
			this.statusMessage = '⚠️ Error: Invalid secret phrase code or corrupt cypher string blocks.';
		}
	}

	// Binary Array File Extraction Object Encryption Pipeline
	private async runFileEncryption(cryptoKey: CryptoKey) {
		if (!this.fileInput) {
			this.statusMessage = 'No local file object loaded.';
			return;
		}

		this.statusMessage = 'Reading local storage byte buffers...';
		const rawFileBuffer = await this.fileInput.arrayBuffer();
		const iv = window.crypto.getRandomValues(new Uint8Array(12));

		this.statusMessage = 'Running system cipher algorithms...';
		const encryptedBuffer = await window.crypto.subtle.encrypt(
			{ name: 'AES-GCM', iv: iv },
			cryptoKey,
			rawFileBuffer
		);

		const packedOutput = new Uint8Array(iv.length + encryptedBuffer.byteLength);
		packedOutput.set(iv, 0);
		packedOutput.set(new Uint8Array(encryptedBuffer), iv.length);

		this.statusMessage = 'Packaging target data blob...';
		this.downloadBlob(packedOutput, `${this.fileInput.name}.avero`);
		this.statusMessage = '✓ Encrypted file package pushed out successfully.';
	}

	// Binary Array File Extraction Object Decryption Pipeline
	private async runFileDecryption(cryptoKey: CryptoKey) {
		if (!this.fileInput) {
			this.statusMessage = 'No matching crypt payload found.';
			return;
		}

		this.statusMessage = 'Reading binary array sequences...';
		const rawArrayBuffer = await this.fileInput.arrayBuffer();

		if (rawArrayBuffer.byteLength < 13) {
			this.statusMessage = '⚠️ Error: Binary signature corrupted or malformed file data.';
			return;
		}

		// Use ArrayBuffer.slice for mobile Safari WebCrypto alignment
		const iv = new Uint8Array(rawArrayBuffer.slice(0, 12));
		const encryptedBytes = new Uint8Array(rawArrayBuffer.slice(12));

		try {
			this.statusMessage = 'Validating validation signatures...';
			const decryptedBuffer = await window.crypto.subtle.decrypt(
				{ name: 'AES-GCM', iv: iv },
				cryptoKey,
				encryptedBytes
			);

			let cleanOutputName = this.fileInput.name.replace(/\.avero$/i, '');
			if (cleanOutputName === this.fileInput.name) {
				cleanOutputName = 'decrypted_' + cleanOutputName;
			}

			this.statusMessage = 'Assembling restored file element...';
			this.downloadBlob(new Uint8Array(decryptedBuffer), cleanOutputName);
			this.statusMessage = '✓ Data block successfully deciphered.';
		} catch (err) {
			console.error(err);
			this.statusMessage = '⚠️ Decryption Failed: Invalid key passphrase supplied.';
		}
	}

	private downloadBlob(uint8ArrayData: Uint8Array, fileName: string) {
		// Slice guarantees a clean standalone buffer without offset issues
		const cleanBuffer = uint8ArrayData.slice().buffer;
		const downloadBlob = new Blob([cleanBuffer as ArrayBuffer], {
			type: 'application/octet-stream'
		});

		const dynamicAnchor = document.createElement('a');
		dynamicAnchor.href = URL.createObjectURL(downloadBlob);
		dynamicAnchor.download = fileName;

		// Required for Firefox on Android and iOS WebViews
		document.body.appendChild(dynamicAnchor);
		dynamicAnchor.click();
		document.body.removeChild(dynamicAnchor);

		// Safari on iOS requires a small delay before revoking the object URL
		setTimeout(() => {
			URL.revokeObjectURL(dynamicAnchor.href);
		}, 1000);
	}

	copyToClipboard() {
		if (!this.textOutput) return;

		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard.writeText(this.textOutput);
		} else {
			const textArea = document.createElement('textarea');
			textArea.value = this.textOutput;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
		}

		const primaryMessage = this.statusMessage;
		this.statusMessage = '📋 Copied to Clipboard!';
		setTimeout(() => {
			this.statusMessage = primaryMessage;
		}, 2000);
	}

	formatBytes(bytes: number, decimals = 2) {
		if (!bytes) return '0 Bytes';
		const k = 1024;
		const dm = decimals < 0 ? 0 : decimals;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
	}
}
