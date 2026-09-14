import aesjs from 'aes-js'
import md5 from '@/utils/md5'

const ACCOUNTS_STORAGE_KEY = 'aix:saved-email-accounts:v1'
const CURRENT_ACCOUNT_STORAGE_KEY = 'aix:current-email-account:v1'
const FALLBACK_KEY_STORAGE_KEY = 'aix:credential-vault-fallback-key:v1'
const VAULT_DATABASE_NAME = 'aix-account-vault'
const VAULT_STORE_NAME = 'keys'
const VAULT_KEY_ID = 'email-password-key-v1'
const MAX_SAVED_ACCOUNTS = 10

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase()
}

function getBrowserCrypto() {
    if (typeof window === 'undefined') return null
    return window.crypto || window.msCrypto || null
}

function createRandomBytes(length) {
    const bytes = new Uint8Array(length)
    const browserCrypto = getBrowserCrypto()
    if (browserCrypto && typeof browserCrypto.getRandomValues === 'function') {
        browserCrypto.getRandomValues(bytes)
        return bytes
    }

    for (let index = 0; index < length; index += 1) {
        bytes[index] = Math.floor(Math.random() * 256)
    }
    return bytes
}

function bytesToBase64(bytes) {
    let binary = ''
    for (let index = 0; index < bytes.length; index += 1) {
        binary += String.fromCharCode(bytes[index])
    }
    return window.btoa(binary)
}

function base64ToBytes(value) {
    const binary = window.atob(String(value || ''))
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index)
    }
    return bytes
}

function openVaultDatabase() {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.indexedDB) {
            reject(new Error('INDEXED_DB_UNAVAILABLE'))
            return
        }

        const request = window.indexedDB.open(VAULT_DATABASE_NAME, 1)
        request.onupgradeneeded = event => {
            const database = event.target.result
            if (!database.objectStoreNames.contains(VAULT_STORE_NAME)) {
                database.createObjectStore(VAULT_STORE_NAME)
            }
        }
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error || new Error('VAULT_DATABASE_OPEN_FAILED'))
    })
}

async function readIndexedDbKey() {
    const database = await openVaultDatabase()
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(VAULT_STORE_NAME, 'readonly')
        const request = transaction.objectStore(VAULT_STORE_NAME).get(VAULT_KEY_ID)
        request.onsuccess = () => {
            const value = request.result
            resolve(Array.isArray(value) ? new Uint8Array(value) : null)
        }
        request.onerror = () => reject(request.error || new Error('VAULT_KEY_READ_FAILED'))
        transaction.oncomplete = () => database.close()
        transaction.onerror = () => database.close()
        transaction.onabort = () => database.close()
    })
}

async function writeIndexedDbKey(keyBytes) {
    const database = await openVaultDatabase()
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(VAULT_STORE_NAME, 'readwrite')
        transaction.objectStore(VAULT_STORE_NAME).put(Array.from(keyBytes), VAULT_KEY_ID)
        transaction.oncomplete = () => {
            database.close()
            resolve()
        }
        transaction.onerror = () => {
            database.close()
            reject(transaction.error || new Error('VAULT_KEY_WRITE_FAILED'))
        }
        transaction.onabort = () => {
            database.close()
            reject(transaction.error || new Error('VAULT_KEY_WRITE_ABORTED'))
        }
    })
}

function readFallbackKey() {
    try {
        const value = localStorage.getItem(FALLBACK_KEY_STORAGE_KEY)
        if (!value) return null
        const bytes = base64ToBytes(value)
        return bytes.length === 32 ? bytes : null
    } catch (error) {
        return null
    }
}

function writeFallbackKey(keyBytes) {
    localStorage.setItem(FALLBACK_KEY_STORAGE_KEY, bytesToBase64(keyBytes))
}

async function getVaultKeyBytes() {
    try {
        const storedKey = await readIndexedDbKey()
        if (storedKey && storedKey.length === 32) return storedKey

        const fallbackKey = readFallbackKey()
        if (fallbackKey) {
            try {
                await writeIndexedDbKey(fallbackKey)
            } catch (error) {
                console.log('同步本地凭据密钥到 IndexedDB 失败', error)
            }
            return fallbackKey
        }

        const generatedKey = createRandomBytes(32)
        await writeIndexedDbKey(generatedKey)
        return generatedKey
    } catch (error) {
        const fallbackKey = readFallbackKey()
        if (fallbackKey) return fallbackKey

        const generatedKey = createRandomBytes(32)
        writeFallbackKey(generatedKey)
        return generatedKey
    }
}

function readStoredAccounts() {
    try {
        const value = JSON.parse(localStorage.getItem(ACCOUNTS_STORAGE_KEY) || '[]')
        if (!Array.isArray(value)) return []
        return value.filter(account => (
            account
            && typeof account.id === 'string'
            && typeof account.email === 'string'
            && typeof account.ciphertext === 'string'
            && typeof account.iv === 'string'
        ))
    } catch (error) {
        return []
    }
}

function writeStoredAccounts(accounts) {
    localStorage.setItem(
        ACCOUNTS_STORAGE_KEY,
        JSON.stringify(accounts.slice(0, MAX_SAVED_ACCOUNTS)),
    )
}

async function encryptWithWebCrypto(password, accountId, keyBytes) {
    const browserCrypto = getBrowserCrypto()
    if (!browserCrypto || !browserCrypto.subtle) return null

    const iv = createRandomBytes(12)
    const key = await browserCrypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-GCM' },
        false,
        ['encrypt'],
    )
    const encrypted = await browserCrypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv,
            additionalData: new Uint8Array(aesjs.utils.utf8.toBytes(accountId)),
        },
        key,
        new Uint8Array(aesjs.utils.utf8.toBytes(password)),
    )

    return {
        algorithm: 'AES-GCM',
        ciphertext: bytesToBase64(new Uint8Array(encrypted)),
        iv: bytesToBase64(iv),
    }
}

function encryptWithAesCbc(password, keyBytes) {
    const iv = createRandomBytes(16)
    const input = aesjs.padding.pkcs7.pad(aesjs.utils.utf8.toBytes(password))
    const cipher = new aesjs.ModeOfOperation.cbc(keyBytes, iv)
    const encrypted = cipher.encrypt(input)

    return {
        algorithm: 'AES-CBC',
        ciphertext: bytesToBase64(new Uint8Array(encrypted)),
        iv: bytesToBase64(iv),
    }
}

async function decryptWithWebCrypto(account, keyBytes) {
    const browserCrypto = getBrowserCrypto()
    if (!browserCrypto || !browserCrypto.subtle) {
        throw new Error('WEB_CRYPTO_UNAVAILABLE')
    }

    const key = await browserCrypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-GCM' },
        false,
        ['decrypt'],
    )
    const decrypted = await browserCrypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: base64ToBytes(account.iv),
            additionalData: new Uint8Array(aesjs.utils.utf8.toBytes(account.id)),
        },
        key,
        base64ToBytes(account.ciphertext),
    )
    return aesjs.utils.utf8.fromBytes(new Uint8Array(decrypted))
}

function decryptWithAesCbc(account, keyBytes) {
    const cipher = new aesjs.ModeOfOperation.cbc(keyBytes, base64ToBytes(account.iv))
    const decrypted = cipher.decrypt(base64ToBytes(account.ciphertext))
    return aesjs.utils.utf8.fromBytes(aesjs.padding.pkcs7.strip(decrypted))
}

export function getEmailAccountId(email) {
    return md5(normalizeEmail(email))
}

export function getSavedEmailAccounts() {
    return readStoredAccounts().sort((first, second) => (
        Number(second.updatedAt || 0) - Number(first.updatedAt || 0)
    ))
}

export function getCurrentEmailAccountId() {
    return localStorage.getItem(CURRENT_ACCOUNT_STORAGE_KEY) || ''
}

export function markCurrentEmailAccount(email) {
    const normalizedEmail = normalizeEmail(email)
    if (!normalizedEmail) return
    localStorage.setItem(CURRENT_ACCOUNT_STORAGE_KEY, getEmailAccountId(normalizedEmail))
}

export function clearCurrentEmailAccount() {
    localStorage.removeItem(CURRENT_ACCOUNT_STORAGE_KEY)
}

export async function saveEmailAccountCredentials(email, password) {
    const normalizedEmail = normalizeEmail(email)
    if (!normalizedEmail || !password) throw new Error('INVALID_ACCOUNT_CREDENTIALS')

    const accountId = getEmailAccountId(normalizedEmail)
    const keyBytes = await getVaultKeyBytes()
    let encrypted

    try {
        encrypted = await encryptWithWebCrypto(String(password), accountId, keyBytes)
    } catch (error) {
        encrypted = null
    }
    if (!encrypted) encrypted = encryptWithAesCbc(String(password), keyBytes)

    const account = {
        id: accountId,
        email: normalizedEmail,
        algorithm: encrypted.algorithm,
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        updatedAt: Date.now(),
    }
    const accounts = readStoredAccounts().filter(item => item.id !== accountId)
    accounts.unshift(account)
    writeStoredAccounts(accounts)
    markCurrentEmailAccount(normalizedEmail)
    return account
}

export async function decryptEmailAccountPassword(account) {
    if (!account || !account.id || !account.ciphertext || !account.iv) {
        throw new Error('INVALID_SAVED_ACCOUNT')
    }

    const keyBytes = await getVaultKeyBytes()
    if (account.algorithm === 'AES-GCM') {
        return decryptWithWebCrypto(account, keyBytes)
    }
    if (account.algorithm === 'AES-CBC') {
        return decryptWithAesCbc(account, keyBytes)
    }
    throw new Error('UNSUPPORTED_CREDENTIAL_ALGORITHM')
}
