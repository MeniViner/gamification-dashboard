/**
 * Compress an image file to a base64 string
 * @param {File} file - The file to compress
 * @param {number} maxWidth - Maximum width of the image (default 300px)
 * @param {number} quality - JPEG quality (0 to 1, default 0.8)
 * @returns {Promise<string>} - The compressed base64 string
 */
export async function compressImage(file, maxWidth = 300, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Resize if needed
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Compress to JPEG
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
}

/**
 * Compress a base64 image string
 * @param {string} base64Str - The base64 string to compress
 * @param {number} maxWidth - Maximum width (default 150)
 * @param {number} quality - JPEG quality (default 0.6)
 * @returns {Promise<string>} - The compressed base64 string
 */
export async function compressBase64Image(base64Str, maxWidth = 150, quality = 0.6) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Resize if needed
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Compress to JPEG
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(dataUrl);
        };
        img.onerror = (error) => reject(error);
    });
}
