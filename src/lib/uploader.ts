
'use client';

export interface UploadOptions {
  onProgress?: (progress: number) => void;
}

/**
 * Uploads a file using XMLHttpRequest to allow for progress tracking.
 * @param url The API endpoint to upload to.
 * @param file The file object to upload.
 * @param options Callbacks for progress updates.
 * @returns A promise that resolves with the server's JSON response.
 */
export const uploadFileWithProgress = (
  url: string,
  file: File,
  options?: UploadOptions
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.open('POST', url, true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded * 100) / event.total);
        if (options?.onProgress) {
          options.onProgress(progress);
        }
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (e) {
          reject(new Error('Failed to parse server response.'));
        }
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          reject(new Error(errorResponse.error || `Upload failed with status: ${xhr.status}`));
        } catch (e) {
          reject(new Error(`Upload failed with status: ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during upload.'));
    };

    xhr.send(formData);
  });
};


/**
 * Uploads a data URI (base64 string) with a simulated progress bar.
 * This is for uploading files that have been read into memory on the client.
 * @param url The API endpoint to upload to.
 * @param dataUri The data URI string.
 * @param options Callbacks for progress updates.
 * @returns A promise that resolves with the server's JSON response.
 */
export const uploadDataUriWithProgress = (
  url: string,
  dataUri: string,
  options?: UploadOptions
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    // Simulate progress for data URI uploads, as xhr.upload.onprogress doesn't work for JSON bodies.
    let progress = 0;
    const interval = setInterval(() => {
      if (progress < 95) {
        progress += 5;
        if (options?.onProgress) {
          options.onProgress(progress);
        }
      }
    }, 150); // Creates a smooth fake progress bar

    xhr.onload = () => {
      clearInterval(interval);
      if (options?.onProgress) {
        options.onProgress(100);
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (e) {
          reject(new Error('Failed to parse server response.'));
        }
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          reject(new Error(errorResponse.error || `Upload failed with status: ${xhr.status}`));
        } catch (e) {
          reject(new Error(`Upload failed with status: ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      clearInterval(interval);
      reject(new Error('Network error during upload.'));
    };

    xhr.send(JSON.stringify({ file: dataUri }));
  });
};
