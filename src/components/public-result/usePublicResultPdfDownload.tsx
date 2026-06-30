"use client";

import { useCallback, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  buildPublicResultPdfFilename,
  renderElementToPdfFile,
  waitForPdfLayout,
} from "@/lib/public-result-pdf";
import type { PublicResultPayload, PublicResultScoresPayload } from "@/lib/types";
import { isPublicResultUnderReview } from "@/lib/types";
import { PublicResultPdfSheet } from "./PublicResultPdfSheet";

export function usePublicResultPdfDownload() {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [pdfData, setPdfData] = useState<PublicResultScoresPayload | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfMessage, setPdfMessage] = useState<string | null>(null);

  const download = useCallback(async (data: PublicResultPayload) => {
    if (isPublicResultUnderReview(data)) {
      alert("This result is under review. PDF download is not available yet.");
      return;
    }
    setPdfBusy(true);
    setPdfMessage("Preparing PDF…");
    try {
      flushSync(() => setPdfData(data));
      const node = await waitForPdfLayout(pdfRef, setPdfMessage);
      await renderElementToPdfFile(
        node,
        buildPublicResultPdfFilename(data),
        setPdfMessage,
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to generate PDF");
    } finally {
      setPdfBusy(false);
      setPdfMessage(null);
      setPdfData(null);
    }
  }, []);

  const portal = (
    <>
      {pdfData ? <PublicResultPdfSheet data={pdfData} innerRef={pdfRef} /> : null}
      {pdfBusy ? (
        <div className="pr-pdf-overlay" role="status" aria-live="polite">
          <div className="pr-pdf-overlay-card">
            <div className="pr-pdf-overlay-spinner" />
            <p className="pr-pdf-overlay-title">Preparing your result PDF</p>
            <p className="pr-pdf-overlay-msg">{pdfMessage ?? "Please wait…"}</p>
          </div>
        </div>
      ) : null}
    </>
  );

  return { download, pdfBusy, portal };
}
