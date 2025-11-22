/**
 * Storage constants for file upload validation and bucket management.
 */

export const DATASET_BUCKET = "datasets";

export const STORAGE_BUCKETS = {
  DATASETS: 'datasets',
  PREVIEWS: 'previews',
} as const;

export const STORAGE_PATHS = {
  upload: (userId: string, datasetId: string) =>
    `uploads/${userId}/${datasetId}`,
  preview: (datasetId: string) =>
    `previews/${datasetId}`,
  processed: (datasetId: string) =>
    `processed/${datasetId}`,
  userFile: (userId: string, folder: string | null, filename: string) =>
    folder ? `${userId}/${folder}/${filename}` : `${userId}/${filename}`,
} as const;

export const ALLOWED_FILE_TYPES = {
  datasets: [
    'application/zip',
    'application/x-zip-compressed',
    'application/x-tar',
    'application/gzip',
    'application/x-gzip',
    'application/x-compressed-tar',
  ],
  previews: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'video/mp4',
  ],
} as const;

export const ALLOWED_EXTENSIONS = [
  '.zip',
  '.tar',
  '.gz',
  '.tgz',
  '.tar.gz',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.mp4',
] as const;

export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 1_099_511_627_776, // 1 TB - background uploads handle massive datasets
  SUPABASE_MAX_FILE_SIZE: 50000000, // 50MB - Supabase free tier limit (fallback)
  CHUNK_SIZE: 10485760, // 10MB chunks
  MAX_PREVIEW_SIZE: 10485760, // 10MB for preview images/videos
} as const;

/**
 * Validates if a file type is allowed for upload.
 */
export function isValidFileType(
  mimeType: string,
  filename: string,
  category: 'datasets' | 'previews' = 'datasets'
): boolean {
  const extension = `.${filename.split('.').pop()?.toLowerCase()}`;

  const allowedTypes = ALLOWED_FILE_TYPES[category];
  const isValidMimeType = (allowedTypes as readonly string[]).includes(mimeType);
  const isValidExtension = (ALLOWED_EXTENSIONS as readonly string[]).includes(extension);

  return isValidMimeType || isValidExtension;
}

/**
 * Gets a human-readable list of allowed file types.
 */
export function getAllowedFileTypesMessage(category: 'datasets' | 'previews' = 'datasets'): string {
  const extensions = category === 'datasets'
    ? ['.zip', '.tar', '.gz', '.tgz']
    : ['.jpg', '.png', '.webp', '.mp4'];

  return `Allowed file types: ${extensions.join(', ')}`;
}
