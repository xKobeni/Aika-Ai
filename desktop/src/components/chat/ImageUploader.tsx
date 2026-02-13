import { useRef, useState, useCallback } from 'react';
import type { ImageAttachment } from '../../types';
import type { DragEvent, ChangeEvent } from 'react';
import { uid, fmtBytes } from '../../lib/utils';

interface ImageUploaderProps {
  images: ImageAttachment[];
  onAddImages: (images: ImageAttachment[]) => void;
  onRemoveImage: (id: string) => void;
  maxImages?: number;
}

export function ImageUploader({
  images,
  onAddImages,
  onRemoveImage,
  maxImages = 10,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
      const remainingSlots = maxImages - images.length;

      if (imageFiles.length > remainingSlots) {
        alert(`You can only add ${remainingSlots} more image(s).`);
        return;
      }

      const newImages: ImageAttachment[] = [];

      imageFiles.forEach((file) => {
        const id = uid();
        setUploadingIds((prev) => new Set(prev).add(id));

        const reader = new FileReader();
        reader.onload = (e) => {
          const url = e.target?.result as string;
          const img = new Image();
          img.onload = () => {
            const imageAttachment: ImageAttachment = {
              id,
              name: file.name,
              size: file.size,
              type: file.type,
              url,
              width: img.width,
              height: img.height,
            };
            newImages.push(imageAttachment);

            if (newImages.length === imageFiles.length) {
              onAddImages(newImages);
              setUploadingIds(new Set());
            }
          };
          img.src = url;
        };
        reader.readAsDataURL(file);
      });
    },
    [images.length, maxImages, onAddImages]
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleFileInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      handleFileSelect(e.target.files);
      e.target.value = '';
    },
    [handleFileSelect]
  );

  if (images.length === 0 && !isDragging) {
    return (
      <div
        className={`imageUploader ${isDragging ? 'is-dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={handleFileInputChange}
        />
        <button
          type="button"
          className="imageUploader__trigger"
          onClick={() => fileInputRef.current?.click()}
        >
          📷 Add Images
        </button>
      </div>
    );
  }

  return (
    <div
      className={`imageUploader ${isDragging ? 'is-dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleFileInputChange}
      />

      <div className="imageUploader__header">
        <span className="imageUploader__title">📷 Attached Images ({images.length})</span>
        {images.length < maxImages && (
          <button
            type="button"
            className="imageUploader__addBtn"
            onClick={() => fileInputRef.current?.click()}
          >
            ＋ Add More
          </button>
        )}
      </div>

      <div className="imageUploader__grid">
        {images.map((image) => (
          <div key={image.id} className="imagePreview">
            <div className="imagePreview__container">
              {image.url ? (
                <img src={image.url} alt={image.name} className="imagePreview__img" />
              ) : (
                <div className="imagePreview__placeholder">
                  {uploadingIds.has(image.id) ? '⏳' : '📷'}
                </div>
              )}
              <button
                type="button"
                className="imagePreview__remove"
                onClick={() => onRemoveImage(image.id)}
                title="Remove image"
                aria-label="Remove image"
              >
                ✕
              </button>
            </div>
            <div className="imagePreview__info">
              <div className="imagePreview__name" title={image.name}>
                {image.name}
              </div>
              <div className="imagePreview__meta">
                {image.width && image.height && `${image.width}×${image.height}`}
                {image.width && image.height && ' · '}
                {fmtBytes(image.size)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isDragging && (
        <div className="imageUploader__dropZone">
          <div className="imageUploader__dropText">Drop images here</div>
        </div>
      )}
    </div>
  );
}
