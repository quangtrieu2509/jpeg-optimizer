export function formatSize(size) {
    const oneMB = 1024 * 1024
    if (size < oneMB) return (size / 1024).toFixed(2) + ' kB'
    return (size / oneMB).toFixed(2) + 'MB'
}
export function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)) }
export function fixFileExtension(file, outputFormat) {
    let fileName = file.name
    if (outputFormat != 'auto') {
        fileName = fileName.slice(0, fileName.lastIndexOf('.'))
        fileName += '.' + outputFormat.split('/')[1]
    }
    return fileName
}
export function getNonConflictName(name, files) {
    if (files[name]) {
        const [baseName, extension] = name.split('.')
        return `${baseName}_.${extension}`
    }
    return name
}