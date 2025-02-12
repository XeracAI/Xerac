export const uploadFileWithProgress = (
  url: string,
  file: File,
  onProgress: (progress: number) => void | undefined
): Promise<{status: number; body: string | undefined }> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    if (onProgress !== undefined) xhr.upload.addEventListener('progress', e => onProgress(e.loaded / e.total));
    xhr.addEventListener('load', () => resolve({ status: xhr.status, body: xhr.responseText }));
    xhr.addEventListener('error', () => reject(new Error('File upload failed')));
    xhr.addEventListener('abort', () => reject(new Error('File upload aborted')));
    xhr.open('PUT', url, true);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
