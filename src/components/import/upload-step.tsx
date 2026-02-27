'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, FileSpreadsheet, FileText, FolderOpen, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UploadStepProps {
  onFilesSelected: (files: File[]) => void;
  selectedFiles: File[];
  skippedFiles: string[];
}

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'csv') return <FileText className="h-5 w-5 text-green-600 flex-shrink-0" />;
  return <FileSpreadsheet className="h-5 w-5 text-blue-600 flex-shrink-0" />;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadStep({ onFilesSelected, selectedFiles, skippedFiles }: UploadStepProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (newFiles: File[]) => {
      // Deduplicate by name+size
      const existing = new Set(selectedFiles.map((f) => `${f.name}:${f.size}`));
      const unique = newFiles.filter((f) => !existing.has(`${f.name}:${f.size}`));
      if (unique.length > 0) {
        onFilesSelected([...selectedFiles, ...unique]);
      }
    },
    [selectedFiles, onFilesSelected]
  );

  const removeFile = useCallback(
    (index: number) => {
      const next = selectedFiles.filter((_, i) => i !== index);
      onFilesSelected(next);
    },
    [selectedFiles, onFilesSelected]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const items = e.dataTransfer.items;
      const files: File[] = [];

      if (items) {
        // Try to read directory entries via webkitGetAsEntry
        const entries: FileSystemEntry[] = [];
        for (let i = 0; i < items.length; i++) {
          const entry = items[i].webkitGetAsEntry?.();
          if (entry) entries.push(entry);
        }

        if (entries.length > 0) {
          const collected = await collectFilesFromEntries(entries);
          files.push(...collected);
        }
      }

      // Fallback to plain file list
      if (files.length === 0) {
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          files.push(e.dataTransfer.files[i]);
        }
      }

      if (files.length > 0) addFiles(files);
    },
    [addFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files;
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList);
      addFiles(files);
      e.target.value = '';
    },
    [addFiles]
  );

  const totalSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);

  // Show file list if we have files
  if (selectedFiles.length > 0) {
    return (
      <div className="space-y-3">
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{selectedFiles.length} file</Badge>
                <span className="text-sm text-muted-foreground">
                  {formatSize(totalSize)} totali
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Aggiungi file
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => folderInputRef.current?.click()}
                >
                  <FolderOpen className="h-3.5 w-3.5 mr-1" />
                  Aggiungi cartella
                </Button>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1">
              {selectedFiles.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 group"
                >
                  {getFileIcon(file.name)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFile(idx)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {skippedFiles.length > 0 && (
          <Card className="border-yellow-200">
            <CardContent className="p-3">
              <p className="text-sm text-yellow-700 font-medium mb-1">
                {skippedFiles.length} file ignorati (formato non supportato):
              </p>
              <p className="text-xs text-yellow-600 truncate">
                {skippedFiles.join(', ')}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />
        <input
          ref={folderInputRef}
          type="file"
          // @ts-expect-error webkitdirectory is a non-standard attribute
          webkitdirectory=""
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>
    );
  }

  // Empty state — drop zone
  return (
    <>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
        }`}
      >
        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-1">
          Trascina file o cartelle qui
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          oppure clicca per selezionare i file
        </p>
        <p className="text-xs text-muted-foreground">
          Formati supportati: CSV, XLSX, XLS (max 10MB per file)
        </p>
      </div>

      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            folderInputRef.current?.click();
          }}
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          Seleziona cartella
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error webkitdirectory is a non-standard attribute
        webkitdirectory=""
        onChange={handleFileInputChange}
        className="hidden"
      />

      {skippedFiles.length > 0 && (
        <Card className="border-yellow-200">
          <CardContent className="p-3">
            <p className="text-sm text-yellow-700 font-medium mb-1">
              {skippedFiles.length} file ignorati (formato non supportato):
            </p>
            <p className="text-xs text-yellow-600 truncate">
              {skippedFiles.join(', ')}
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// --- Helpers for drag & drop folder traversal ---

async function collectFilesFromEntries(entries: FileSystemEntry[]): Promise<File[]> {
  const files: File[] = [];

  async function readEntry(entry: FileSystemEntry): Promise<void> {
    if (entry.isFile) {
      const file = await new Promise<File>((resolve, reject) => {
        (entry as FileSystemFileEntry).file(resolve, reject);
      });
      files.push(file);
    } else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      const children = await new Promise<FileSystemEntry[]>((resolve, reject) => {
        reader.readEntries(resolve, reject);
      });
      for (const child of children) {
        await readEntry(child);
      }
    }
  }

  for (const entry of entries) {
    await readEntry(entry);
  }

  return files;
}
