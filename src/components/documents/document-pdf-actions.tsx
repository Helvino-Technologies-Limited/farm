"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share2 } from "lucide-react";
import { downloadDocumentPdf, documentPdfBlob, type DocumentPdfData } from "@/lib/pdf/generate-document-pdf";
import { toast } from "sonner";

export function DocumentPdfActions({ data, filename }: { data: DocumentPdfData; filename: string }) {
  const [sharing, setSharing] = useState(false);

  function handleDownload() {
    downloadDocumentPdf(data, filename);
  }

  async function handleShare() {
    setSharing(true);
    try {
      const blob = documentPdfBlob(data);
      const file = new File([blob], filename, { type: "application/pdf" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${data.type === "INVOICE" ? "Invoice" : "Receipt"} ${data.documentNumber}`,
          text: `${data.farmName} — ${data.type === "INVOICE" ? "Invoice" : "Receipt"} ${data.documentNumber}`,
        });
      } else {
        // Desktop / unsupported browsers can't attach a file to a wa.me link — download it and
        // open WhatsApp Web so the user can attach the file manually.
        downloadDocumentPdf(data, filename);
        const text = encodeURIComponent(
          `${data.farmName} — ${data.type === "INVOICE" ? "Invoice" : "Receipt"} ${data.documentNumber}. The PDF has been downloaded — please attach it here.`
        );
        window.open(`https://wa.me/?text=${text}`, "_blank");
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        toast.error("Could not share the document.");
      }
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleDownload}>
        <Download className="h-4 w-4" /> Download PDF
      </Button>
      <Button variant="outline" size="sm" onClick={handleShare} disabled={sharing}>
        <Share2 className="h-4 w-4" /> Share via WhatsApp
      </Button>
    </div>
  );
}
