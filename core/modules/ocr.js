const Tesseract = require('tesseract.js');
const fetch = require('node-fetch');

/**
 * Extracts text from an image URL or buffer using Tesseract.js.
 * @param {string|Buffer} image - The image URL or buffer.
 * @returns {Promise<string>} - The extracted text.
 */
async function extractTextFromImage(image) {
    try {
        let imageBuffer;
        if (typeof image === 'string') {
            const response = await fetch(image);
            console.log(response)
            if (!response.ok) throw new Error('Failed to fetch image');
            imageBuffer = await response.buffer();
        } else {
            imageBuffer = image;
        }

        console.log('Starting OCR processing...');
        const { data: { text } } = await Tesseract.recognize(
            imageBuffer,
            'eng',
            {
                logger: info => console.log(info)
            }
        );

        console.log('OCR processing completed.');
        return text.trim();
    } catch (error) {
        console.error('Error during OCR processing:', error);
        throw new Error('Failed to extract text from image.');
    }
}

module.exports = {
    extractTextFromImage
};
