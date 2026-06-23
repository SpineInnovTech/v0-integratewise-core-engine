"use client";

import { useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { spineClient, ingestCSV } from "@/lib/spine-client";
import Papa from "papaparse";

interface FileUploadHandlerProps {
  tenantId: string;
  entityType?: string;
  onUploadComplete?: (results: any) => void;
}

type UploadStatus = "idle" | "uploading" | "processing" | "success" | "error";

export function FileUploadHandler({
  tenantId,
  entityType = "account",
  onUploadComplete,
}: FileUploadHandlerProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setStatus("uploading");
    setError(null);
    setProgress(0);

    try {
      // Step 1: Parse CSV
      const text = await file.text();

      Papa.parse(text, {
        complete: async (results) => {
          if (!results.data || results.data.length < 2) {
            throw new Error("CSV file is empty or invalid");
          }

          setStatus("processing");

          // Step 2: L0 → L3 - Ingest to Adaptive Spine
          const csvData = results.data as string[][];
          const totalRows = csvData.length - 1; // Exclude header

          try {
            const ingestResults = await ingestCSV(file as any);

            setUploadedCount(ingestResults.length);
            setProgress(100);
            setStatus("success");

            // Callback with results
            if (onUploadComplete) {
              onUploadComplete({
                total: totalRows,
                successful: ingestResults.length,
                failed: totalRows - ingestResults.length,
                results: ingestResults,
              });
            }
          } catch (err) {
            throw new Error(
              `Spine ingestion failed: ${err instanceof Error ? err.message : "Unknown error"}`
            );
          }
        },
        error: (error) => {
          setStatus("error");
          setError(`CSV parsing failed: ${error.message}`);
        },
      });
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const getStatusDisplay = () => {
    switch (status) {
      case "idle":
        return (
          <div className="text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Drop files here or click to upload</h3>
            <p className="text-sm text-gray-500 mb-4">Supports CSV, Excel, JSON files up to 10MB</p>
            <label htmlFor="file-upload" className="cursor-pointer">
              <Button className="bg-[#2d5a3d] hover:bg-[#2D5A3D]">
                <Upload className="w-4 h-4 mr-2" />
                Select Files
              </Button>
              <input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.json"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>
        );

      case "uploading":
      case "processing":
        return (
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[#2d5a3d] mx-auto mb-4 animate-spin" />
            <h3 className="font-semibold text-gray-900 mb-2">
              {status === "uploading" ? "Uploading..." : "Processing..."}
            </h3>
            <p className="text-sm text-gray-500 mb-4">{fileName}</p>
            {status === "processing" && (
              <div className="max-w-xs mx-auto">
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-[#2d5a3d] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Ingesting to Adaptive Spine... {uploadedCount} records
                </p>
              </div>
            )}
          </div>
        );

      case "success":
        return (
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-iw-forest-mid mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Upload Complete!</h3>
            <p className="text-sm text-gray-500 mb-4">
              Successfully ingested {uploadedCount} records into The Spine
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setStatus("idle");
                setUploadedCount(0);
                setFileName("");
              }}
            >
              Upload Another File
            </Button>
          </div>
        );

      case "error":
        return (
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-iw-red mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Upload Failed</h3>
            <p className="text-sm text-iw-red mb-4">{error}</p>
            <Button
              variant="outline"
              onClick={() => {
                setStatus("idle");
                setError(null);
                setFileName("");
              }}
            >
              Try Again
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12">
      {getStatusDisplay()}
    </div>
  );
}
