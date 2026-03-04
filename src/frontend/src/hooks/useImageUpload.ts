import { useCallback, useState } from "react";

export interface ImageUploadState {
  isUploading: boolean;
  progress: number;
}

export function useImageUpload() {
  const [state, setState] = useState<ImageUploadState>({
    isUploading: false,
    progress: 0,
  });

  const uploadImage = useCallback(async (file: File): Promise<string> => {
    if (!file.type.startsWith("image/")) {
      throw new Error("File must be an image");
    }

    setState({ isUploading: true, progress: 10 });

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const pct = Math.round((event.loaded / event.total) * 80) + 10;
          setState({ isUploading: true, progress: pct });
        }
      };

      reader.onload = () => {
        setState({ isUploading: false, progress: 100 });
        resolve(reader.result as string);
      };

      reader.onerror = () => {
        setState({ isUploading: false, progress: 0 });
        reject(new Error("Failed to read file"));
      };

      reader.readAsDataURL(file);
    });
  }, []);

  // Alias: `upload` for convenience
  const upload = uploadImage;

  return {
    uploadImage,
    upload,
    isUploading: state.isUploading,
    progress: state.progress,
  };
}
