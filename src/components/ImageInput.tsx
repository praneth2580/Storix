import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageInputProps {
  value: string | null;
  onChange: (imageDataUrl: string | null) => void;
  label?: string;
  description?: string;
  accept?: string;
  className?: string;
  showPreview?: boolean;
  previewSize?: 'sm' | 'md' | 'lg';
  allowUrlInput?: boolean;
  onUrlChange?: (url: string) => void;
  urlValue?: string;
  compact?: boolean; // Compact mode for smaller height
}

export function ImageInput({
  value,
  onChange,
  label,
  description,
  accept = 'image/*',
  className = '',
  showPreview = true,
  previewSize = 'md',
  allowUrlInput = false,
  onUrlChange,
  urlValue,
  compact = false
}: ImageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const previewSizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  return (
    <div className={className}>
      {label && (
        <label className={`text-xs text-text-muted uppercase font-bold tracking-wider ${compact ? 'mb-1' : 'mb-2'} block`}>
          {label}
        </label>
      )}
      {description && !compact && (
        <p className="text-xs text-text-muted mb-2">
          {description}
        </p>
      )}
      
      <div className={compact ? 'space-y-1' : 'space-y-2'}>
        {(value || (allowUrlInput && urlValue)) && showPreview ? (
          <div className="relative inline-block">
            <div className={`${previewSizeClasses[previewSize]} border-2 border-border-primary rounded-lg overflow-hidden bg-primary flex items-center justify-center`}>
              <img
                src={value || urlValue || ''}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 bg-accent-red hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors"
              title="Remove image"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              border-2 border-dashed rounded-lg cursor-pointer transition-all
              ${isDragging 
                ? 'border-accent-blue bg-accent-blue/10 scale-[1.02]' 
                : 'border-border-primary hover:border-accent-blue/50 bg-primary hover:bg-secondary'
              }
              ${compact 
                ? (value || (allowUrlInput && urlValue)) ? 'p-1.5' : 'p-3'
                : (value || (allowUrlInput && urlValue)) ? 'p-2' : 'p-6'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className={`flex flex-col items-center justify-center text-center ${compact ? 'gap-1' : ''}`}>
              {(value || (allowUrlInput && urlValue)) ? (
                <div className={`flex items-center gap-2 ${compact ? 'text-xs' : 'text-sm'} text-text-muted`}>
                  <ImageIcon size={compact ? 14 : 16} />
                  <span>{compact ? 'Change' : 'Click to change image'}</span>
                </div>
              ) : (
                <>
                  <div className={`${compact ? 'mb-1 p-2' : 'mb-3 p-3'} bg-accent-blue/10 rounded-full`}>
                    <Upload size={compact ? 18 : 24} className="text-accent-blue" />
                  </div>
                  <p className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-text-primary ${compact ? '' : 'mb-1'}`}>
                    {compact ? 'Upload image' : 'Drop image here or click to upload'}
                  </p>
                  {!compact && (
                    <p className="text-xs text-text-muted">
                      Supports: JPG, PNG, GIF, WebP
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}
        
        {(value || (allowUrlInput && urlValue)) && !compact && (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              onUrlChange?.('');
            }}
            className="text-xs text-accent-red hover:text-red-600 hover:underline transition-colors"
          >
            Remove image
          </button>
        )}
        
        {allowUrlInput && (
          <div className={`${compact ? 'mt-1 pt-1' : 'mt-2 pt-2'} border-t border-border-primary`}>
            <label className={`text-xs text-text-muted ${compact ? 'mb-0.5' : 'mb-1'} block`}>Or enter image URL:</label>
            <input
              type="url"
              value={urlValue || ''}
              onChange={(e) => onUrlChange?.(e.target.value)}
              className={`w-full bg-primary border border-border-primary ${compact ? 'p-1.5 text-xs' : 'p-2 text-sm'} text-text-primary focus:border-accent-blue focus:outline-none rounded-sm`}
              placeholder="https://example.com/image.jpg"
            />
            {urlValue && !compact && (
              <button
                type="button"
                onClick={() => onUrlChange?.('')}
                className="mt-1 text-xs text-accent-red hover:text-red-600 hover:underline transition-colors"
              >
                Clear URL
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

