import { FC, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { StyledDropzone } from "./styles";

export const Dropzone: FC<{
  onFile?: (file: File) => void;
  helper?: string;
}> = ({ onFile, helper }) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      onFile?.(file);
    },
    [onFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
  });

  return (
    <StyledDropzone {...getRootProps()}>
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the file here ...</p>
      ) : (
        <p>Drop {helper ?? ""} here, or click to select file</p>
      )}
    </StyledDropzone>
  );
};
