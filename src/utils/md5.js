const ROTATION_AMOUNTS = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
]

const ROUND_CONSTANTS = Array.from({ length: 64 }, (_, index) => (
    Math.floor(Math.abs(Math.sin(index + 1)) * 0x100000000) >>> 0
))

function rotateLeft(value, amount) {
    return ((value << amount) | (value >>> (32 - amount))) >>> 0
}

function toUtf8Bytes(value) {
    const input = String(value)
    const bytes = []

    for (let index = 0; index < input.length; index += 1) {
        let codePoint = input.charCodeAt(index)

        if (codePoint >= 0xD800 && codePoint <= 0xDBFF) {
            const next = input.charCodeAt(index + 1)
            if (next >= 0xDC00 && next <= 0xDFFF) {
                codePoint = ((codePoint - 0xD800) * 0x400) + (next - 0xDC00) + 0x10000
                index += 1
            } else {
                codePoint = 0xFFFD
            }
        } else if (codePoint >= 0xDC00 && codePoint <= 0xDFFF) {
            codePoint = 0xFFFD
        }

        if (codePoint <= 0x7F) {
            bytes.push(codePoint)
        } else if (codePoint <= 0x7FF) {
            bytes.push(
                0xC0 | (codePoint >>> 6),
                0x80 | (codePoint & 0x3F),
            )
        } else if (codePoint <= 0xFFFF) {
            bytes.push(
                0xE0 | (codePoint >>> 12),
                0x80 | ((codePoint >>> 6) & 0x3F),
                0x80 | (codePoint & 0x3F),
            )
        } else {
            bytes.push(
                0xF0 | (codePoint >>> 18),
                0x80 | ((codePoint >>> 12) & 0x3F),
                0x80 | ((codePoint >>> 6) & 0x3F),
                0x80 | (codePoint & 0x3F),
            )
        }
    }

    return bytes
}

function wordToLittleEndianHex(word) {
    let output = ''
    for (let index = 0; index < 4; index += 1) {
        output += ((word >>> (index * 8)) & 0xFF).toString(16).padStart(2, '0')
    }
    return output
}

/**
 * 返回输入内容的 32 位小写 MD5 摘要。
 *
 * MD5 只能用于摘要/稳定标识，不能用于需要还原原文的密码存储。
 */
export function md5(value) {
    const source = toUtf8Bytes(value)
    const paddedLength = Math.ceil((source.length + 9) / 64) * 64
    const message = new Uint8Array(paddedLength)
    message.set(source)
    message[source.length] = 0x80

    const bitLength = source.length * 8
    const bitLengthLow = bitLength >>> 0
    const bitLengthHigh = Math.floor(bitLength / 0x100000000) >>> 0
    const lengthOffset = paddedLength - 8

    for (let index = 0; index < 4; index += 1) {
        message[lengthOffset + index] = (bitLengthLow >>> (index * 8)) & 0xFF
        message[lengthOffset + 4 + index] = (bitLengthHigh >>> (index * 8)) & 0xFF
    }

    let stateA = 0x67452301
    let stateB = 0xEFCDAB89
    let stateC = 0x98BADCFE
    let stateD = 0x10325476

    for (let offset = 0; offset < message.length; offset += 64) {
        const words = new Uint32Array(16)
        for (let index = 0; index < 16; index += 1) {
            const wordOffset = offset + (index * 4)
            words[index] = (
                message[wordOffset]
                | (message[wordOffset + 1] << 8)
                | (message[wordOffset + 2] << 16)
                | (message[wordOffset + 3] << 24)
            ) >>> 0
        }

        let a = stateA
        let b = stateB
        let c = stateC
        let d = stateD

        for (let round = 0; round < 64; round += 1) {
            let result
            let wordIndex

            if (round < 16) {
                result = (b & c) | ((~b) & d)
                wordIndex = round
            } else if (round < 32) {
                result = (d & b) | ((~d) & c)
                wordIndex = ((5 * round) + 1) % 16
            } else if (round < 48) {
                result = b ^ c ^ d
                wordIndex = ((3 * round) + 5) % 16
            } else {
                result = c ^ (b | (~d))
                wordIndex = (7 * round) % 16
            }

            const previousD = d
            d = c
            c = b
            b = (b + rotateLeft(
                (a + result + ROUND_CONSTANTS[round] + words[wordIndex]) >>> 0,
                ROTATION_AMOUNTS[round],
            )) >>> 0
            a = previousD
        }

        stateA = (stateA + a) >>> 0
        stateB = (stateB + b) >>> 0
        stateC = (stateC + c) >>> 0
        stateD = (stateD + d) >>> 0
    }

    return [stateA, stateB, stateC, stateD]
        .map(wordToLittleEndianHex)
        .join('')
}

export default md5
