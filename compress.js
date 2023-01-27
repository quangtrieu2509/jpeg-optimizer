import imageCompression from 'https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.0/dist/browser-image-compression.mjs'
import gifsicle from 'https://cdn.jsdelivr.net/npm/gifsicle-wasm-browser/dist/gifsicle.min.js'
import 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js'
async function compressStatic(file, options, onProgress) {
    const compressionOptions = { maxWidthOrHeight: options.maxDimension, initialQuality: options.initialQuality / 100, maxSizeMB: options.maxSizeKB ? options.maxSizeKB / 1024 : undefined, fileType: options.outputFormat == 'auto' ? undefined : options.outputFormat, maxIteration: 100, onProgress, }
    return await imageCompression(file, compressionOptions)
}
async function compressAnimated(file, options, onProgress) {
    const runGifsicle = async (options2) => {
        const result2 = await gifsicle.run({ input: [{ file, name: '1.gif' }], command: [`${options2} 1.gif -o /out/${file.name}`], })
        return result2[0]
    }
    if (options.maxDimension) { file = await runGifsicle(`--resize-fit ${options.maxDimension}x${options.maxDimension}`) }
    let lossiness = (100 - options.initialQuality) * 2
    let maxIteration = 100
    let result
    let index = 1
    do {
        result = await runGifsicle('--lossy=' + lossiness)
        lossiness *= 1.2
        lossiness = lossiness > 200 ? 200 : Math.round(lossiness)
        file = await runGifsicle('--scale 0.9')
        onProgress((100 * index) / maxIteration)
    } while (index++ <= maxIteration && options.maxSizeKB && result.size > options.maxSizeKB * 1024)
    return result
}
function getImageCanvas(image) {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.width = image.width
    canvas.height = image.height
    context.drawImage(image, 0, 0)
    return canvas
}
async function loadImage(url) {
    var image = new Image()
    image.src = url
    const canvas = await new Promise((res) => {
        image.onload = function () {
            var data = getImageCanvas(image)
            res(data)
        }
    })
    return canvas
}
async function convertJpgPng2Gif(name, url) {
    const gif = new GIF({ repeat: -1 })
    const data = await loadImage(url)
    gif.addFrame(data)
    const result = await new Promise((res) => {
        gif.on('finished', (blob) => res(blob))
        gif.render()
    })
    return new File([result], name)
}
export async function compressImage(file, options, progressBar, url) {
    const isOutFormatGif = options.outputFormat === 'image/gif'
    const isOutFormatAuto = options.outputFormat === 'auto'
    const isInFormatGif = file.name.endsWith('gif')
    const saveAsGif = isOutFormatGif || (isOutFormatAuto && isInFormatGif)
    if (saveAsGif && !isInFormatGif) {
        const reducedOptions = { outputFormat: 'image/jpeg', maxSizeKB: 20 }
        const reduced = await compressImage(file, reducedOptions, progressBar, url)
        const reducedURL = URL.createObjectURL(reduced)
        window.open(reducedURL, '_blank')
        file = await convertJpgPng2Gif(file.name, reducedURL)
        URL.revokeObjectURL(reducedURL)
    }
    const p0 = progressBar.value
    const onProgress = (progress) => (progressBar.value = p0 + progress / 100)
    const result = saveAsGif ? await compressAnimated(file, options, onProgress) : await compressStatic(file, options, onProgress)
    onProgress(100)
    return result
}