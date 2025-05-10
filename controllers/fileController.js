import fs from 'fs';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

/**
 * Xử lý file và chuyển đổi nội dung thành text.
 * @param {string} filePath - Đường dẫn file.
 * @param {string} fileType - Loại file (MIME type).
 * @returns {Promise<string>} Nội dung file dưới dạng text.
 */
export async function processFileContent(filePath, fileType) {
    try {
        let text = '';

        if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            // Xử lý file DOCX
            const result = await mammoth.extractRawText({ path: filePath });
            text = result.value;
        } else if (fileType === 'application/pdf') {
            // Xử lý file PDF
            const dataBuffer = fs.readFileSync(filePath);
            const result = await pdfParse(dataBuffer);
            text = result.text;
        } else {
            throw new Error('Loại file không được hỗ trợ!');
        }

        // Xóa file sau khi xử lý
        fs.unlinkSync(filePath);

        return text;
    } catch (error) {
        console.error('Lỗi khi xử lý file:', error);
        throw error;
    }
}