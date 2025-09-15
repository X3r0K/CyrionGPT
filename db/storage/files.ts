import { makeAuthenticatedRequest } from '@/lib/api/convex';
import JSZip from 'jszip';
import type { TablesInsert } from '@/supabase/types';
import type { Id } from '@/convex/_generated/dataModel';

export const uploadFile = async (
  file: File,
  fileRecord: Omit<TablesInsert<'files'>, 'file_path' | 'user_id'>,
): Promise<{
  file: {
    _id: Id<'files'>;
    _creationTime: number;
    user_id: string;
    file_path: string;
    name: string;
    size: number;
    tokens: number;
    type: string;
    message_id?: string;
    chat_id?: string;
    updated_at?: number;
  };
  storageId: string;
}> => {
  // Enforce 20MB client-side limit for files
  const FILE_LIMIT_BYTES = 20 * 1024 * 1024;
  if (file.size > FILE_LIMIT_BYTES) {
    throw new Error(`File must be less than 20MB`);
  }

  try {
    // Step 1: Request an upload URL
    const genResp = await makeAuthenticatedRequest(
      `/api/generate-upload-url`,
      'POST',
      { kind: 'file', size: file.size },
    );

    const postUrl: string | undefined = genResp?.uploadUrl;
    if (!postUrl) {
      throw new Error('Failed to generate upload URL');
    }

    // Step 2: POST the file to the upload URL
    const uploadResponse = await fetch(postUrl, {
      method: 'POST',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    if (!uploadResponse.ok) {
      const err = await uploadResponse.json().catch(() => ({}));
      throw new Error(err?.error || 'Failed to upload to storage');
    }

    const { storageId } = (await uploadResponse.json()) as {
      storageId: string;
    };
    if (!storageId) {
      throw new Error('No storageId returned from upload');
    }

    // Step 3: Save the storageId and metadata via API
    const saveResp = await makeAuthenticatedRequest(
      `/api/save-uploaded-file`,
      'POST',
      {
        storageId,
        metadata: {
          name: fileRecord.name,
          tokens: fileRecord.tokens || 0,
          type: fileRecord.type,
          size: file.size,
        },
      },
    );

    if (!saveResp?.success) {
      throw new Error(saveResp?.error || 'Failed to save uploaded file');
    }

    return {
      file: saveResp.file,
      storageId,
    };
  } catch (error) {
    console.error('Error uploading file via upload URL flow:', error);
    throw error;
  }
};

export const getFileFromStorage = async (
  storageId: string,
): Promise<string> => {
  try {
    // Validate storageId before making API call
    if (!storageId || storageId.trim() === '') {
      return '';
    }

    // Handle Convex storage files
    const result = await makeAuthenticatedRequest(
      `/api/get-storage-url`,
      'POST',
      { storageId },
    );

    return result?.url || '';
  } catch (error) {
    console.error('Error getting file URL:', error);
    return '';
  }
};

/**
 * Downloads a single file from storage and triggers browser download
 */
export const downloadFile = async (fileUrl: string, fileName: string) => {
  try {
    // Fetch the file from the Convex storage URL
    const response = await fetch(fileUrl);

    if (!response.ok) {
      throw new Error('Error downloading file');
    }

    // Create blob and download link
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName || 'download';
    document.body.appendChild(a);
    a.click();

    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return true;
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
};

/**
 * Downloads multiple files in sequence
 */
export const downloadMultipleFiles = async (
  files: Array<{ url: string; fileName: string }>,
  onProgress?: (current: number, total: number) => void,
) => {
  if (files.length === 0) {
    return { success: 0, failed: 0 };
  }

  let successCount = 0;
  let failedCount = 0;

  // Process each file sequentially
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      await downloadFile(file.url, file.fileName);
      successCount++;

      // Report progress
      if (onProgress) {
        onProgress(i + 1, files.length);
      }

      // Small delay to prevent browser throttling
      if (i < files.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      failedCount++;
      console.error(`Failed to download ${file.fileName}:`, error);
    }
  }

  return {
    success: successCount,
    failed: failedCount,
  };
};

/**
 * Downloads multiple files as a single ZIP archive
 */
export const downloadFilesAsZip = async (
  files: Array<{ url: string; fileName: string }>,
  zipFileName = 'download.zip',
  onProgress?: (current: number, total: number) => void,
) => {
  if (files.length === 0) {
    return { success: 0, failed: 0 };
  }

  try {
    const zip = new JSZip();
    let successCount = 0;
    let failedCount = 0;

    // Add each file to the ZIP
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Report progress on file fetching
        if (onProgress) {
          onProgress(i, files.length * 2); // First half of progress is fetching
        }

        // Fetch the file from Convex storage URL
        const response = await fetch(file.url);

        if (!response.ok) {
          throw new Error('Failed to fetch file');
        }

        // Add file to zip
        const arrayBuffer = await response.arrayBuffer();
        zip.file(file.fileName, arrayBuffer);
        successCount++;
      } catch (error) {
        console.error(`Failed to add ${file.fileName} to ZIP:`, error);
        failedCount++;
      }
    }

    // Generate the ZIP file
    if (onProgress) {
      onProgress(files.length, files.length * 2); // Mark fetching as complete
    }

    let lastProgress = 0;
    const zipBlob = await zip.generateAsync(
      {
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      },
      (metadata) => {
        // Progress callback for zip generation
        if (onProgress) {
          const zipProgress = metadata.percent / 100;
          const overallProgress = files.length + files.length * zipProgress;
          const currentProgress = Math.floor(overallProgress);

          // Only update if progress changed to avoid too many updates
          if (currentProgress > lastProgress) {
            lastProgress = currentProgress;
            onProgress(currentProgress, files.length * 2);
          }
        }
      },
    );

    // Download the ZIP file
    const url = window.URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = zipFileName;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    if (onProgress) {
      onProgress(files.length * 2, files.length * 2); // Mark as complete
    }

    return {
      success: successCount,
      failed: failedCount,
      zipCreated: true,
    };
  } catch (error) {
    console.error('Error creating ZIP file:', error);
    throw error;
  }
};
