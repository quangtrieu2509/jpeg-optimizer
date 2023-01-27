import { compressImage } from './compress.js'
import { fileToArrayBuffer, zip } from './zip.js'
import { getNonConflictName, fixFileExtension, formatSize, sleep, } from './helpers.js'
const maxInputLength = 20
const clearOutputOnCompress = true
const websiteName = 'I appreciate a tip - '
const filePicker = document.querySelector('#file-picker')
const compressButton = document.querySelector('#compress')
const resetButton = document.querySelector('#reset')
const downloadAllButton = document.querySelector('#download-all')
const progressBar = document.querySelector('#progress')
const optionsForm = document.querySelector('#options')
const inputImageTemplate = document.querySelector('#input-image')
const inputImagesContainer = document.querySelector('#input-images')
const outputImageTemplate = document.querySelector('#output-image')
const outputImagesContainer = document.querySelector('#output-images')
const inputImages = []
let outputImages = {}
const outputURLs = []
function appendInputImage(file) {
    const url = URL.createObjectURL(file)
    const dataItem = { file, url }
    inputImages.push(dataItem)
    const displayItem = inputImageTemplate.content.cloneNode(true)
    displayItem.querySelector('#image').src = url
    displayItem.querySelector('#file-name').innerText = file.name
    displayItem.querySelector('#original-size').innerText = formatSize(file.size)
    displayItem.querySelector('#remove-btn').onclick = () => removeInputImage(inputImages.indexOf(dataItem))
    inputImagesContainer.appendChild(displayItem)
}
function removeInputImage(index) {
    if (isRunning()) return; URL.revokeObjectURL(inputImages[index].url)
    inputImages.splice(index, 1)
    inputImagesContainer.children[index].remove()
}
function clearInputImages() { if (isRunning()) return; inputImages.forEach((v, i) => removeInputImage(i)) }
function clearOutputImages() {
    outputURLs.forEach(URL.revokeObjectURL)
    outputImagesContainer.innerHTML = ""
    outputImages = {}
}
function appendOutputImage(file, file0, index, name) {
    const url = URL.createObjectURL(file)
    outputURLs.push(url)
    const sizeReduction = Math.floor((1 - file.size / file0.size) * 100)
    const item = outputImageTemplate.content.cloneNode(true)
    item.querySelector('#image').src = url
    item.querySelector('#file-name').innerText = `${index}. ${name}`
    item.querySelector('#original-size').innerText = formatSize(file0.size)
    item.querySelector('#new-size').innerText = formatSize(file.size)
    item.querySelector('#size-reduction').innerText = sizeReduction.toFixed(2)
    const downloadButton = item.querySelector('#download-btn')
    downloadButton.href = url
    downloadButton.download = websiteName + name
    outputImagesContainer.insertBefore(item, outputImagesContainer.firstChild)
}
filePicker.onchange = () => {
    for (const file of filePicker.files) {
        alert('hello')
        if (inputImages.length >= maxInputLength) break
        appendInputImage(file)
    }
    const optionsHeader = document.querySelector('#options-header')
    optionsHeader?.scrollIntoView({ behavior: 'smooth' })
}
function isRunning() { return compressButton.classList.contains('is-loading') }
async function compressAndShowImages(formData) {
    if (isRunning()) return; compressButton.classList.toggle('is-loading')
    resetButton.setAttribute('disabled', 'disabled')
    downloadAllButton.setAttribute('disabled', 'disabled')
    if (clearOutputOnCompress) clearOutputImages()
    const { length } = inputImages
    progressBar.max = length
    progressBar.value = 0
    const options = { maxDimension: +formData.get('maxdimension') || undefined, initialQuality: +formData.get('quality'), outputFormat: formData.get('format'), maxSizeKB: +formData.get('maxsize') || undefined, }
    for (let index = length - 1; index >= 0; index--) {
        await sleep(1e3)
        const { file, url } = inputImages[index]
        const compressedFile = await compressImage(file, options, progressBar, url)
        const compressedData = await fileToArrayBuffer(compressedFile)
        const fileName = fixFileExtension(compressedFile, options.outputFormat)
        appendOutputImage(compressedFile, file, index + 1, fileName)
        const zipFileName = getNonConflictName(fileName, outputImages)
        outputImages[websiteName + zipFileName] = compressedData
    }
    if (downloadAllButton.href) URL.revokeObjectURL(downloadAllButton.href)
    const zipUInt8Array = await zip(outputImages)
    const zipBlob = new Blob([zipUInt8Array])
    const zipUrl = URL.createObjectURL(zipBlob)
    downloadAllButton.style.display = 'block'
    downloadAllButton.href = zipUrl
    resetButton.removeAttribute('disabled')
    downloadAllButton.removeAttribute('disabled')
    downloadAllButton.scrollIntoView({ behavior: 'smooth' })
    compressButton.classList.toggle('is-loading')
}
optionsForm.onsubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(optionsForm)
    compressAndShowImages(formData)
}
optionsForm.onreset = () => clearInputImages()