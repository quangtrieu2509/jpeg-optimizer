import { zip as zipCallback } from 'https://cdn.jsdelivr.net/npm/fflate@0.7.4/esm/browser.js'
export function zip(data, options = { level: 0 }) {
    return new Promise((resolve, reject) => {
        zipCallback(data, options, (err, data) => {
            console.warn('err = ', err)
            console.log('data = ', data)
            if (err) return reject(err)
            return resolve(data)
        })
    })
}
export function fileToArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            const fileByteArray = e.currentTarget.result
            const fileUInt8Array = new Uint8Array(fileByteArray)
            return resolve(fileUInt8Array)
        }
        reader.onerror = (e) => reject(e)
        reader.readAsArrayBuffer(file)
    })
}