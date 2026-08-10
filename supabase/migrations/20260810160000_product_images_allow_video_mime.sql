-- Allow product short clips in product-images bucket (products/videos/...)
UPDATE storage.buckets
SET
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ],
  file_size_limit = GREATEST(COALESCE(file_size_limit, 0), 12582912)
WHERE id = 'product-images';
