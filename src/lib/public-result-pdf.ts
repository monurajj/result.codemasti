import type { RefObject } from "react";

export async function waitForPdfLayout(
  ref: RefObject<HTMLDivElement | null>,
  onProgress?: (message: string) => void,
): Promise<HTMLDivElement> {
  onProgress?.("Preparing document…");
  for (let i = 0; i < 80; i++) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    if (ref.current) break;
  }
  const node = ref.current;
  if (!node) {
    throw new Error("PDF layout not ready. Please try again.");
  }

  onProgress?.("Loading images…");
  const images = Array.from(node.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          const finish = () => resolve();
          img.addEventListener("load", finish, { once: true });
          img.addEventListener("error", finish, { once: true });
          setTimeout(finish, 10000);
        }),
    ),
  );
  await new Promise<void>((resolve) => setTimeout(resolve, 150));
  return node;
}

type PdfPageSize = { getWidth: () => number; getHeight: () => number };
type PdfInstance = {
  internal: { pageSize: PdfPageSize };
  addPage: () => void;
  addImage: (img: string, format: string, x: number, y: number, w: number, h: number) => void;
  getImageProperties: (img: string) => { width: number; height: number };
  save: (filename: string) => void;
};
type PdfConstructor = new (options: { orientation: string; unit: string; format: string }) => PdfInstance;

export async function renderElementToPdfFile(
  node: HTMLElement,
  filename: string,
  onProgress?: (message: string) => void,
): Promise<void> {
  onProgress?.("Generating PDF…");
  const [{ default: html2canvas }, jsPdfMod] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const { jsPDF } = jsPdfMod as unknown as { jsPDF: PdfConstructor };

  const canvas = await html2canvas(node, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    windowWidth: node.scrollWidth,
    windowHeight: node.scrollHeight,
  });
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgProps = pdf.getImageProperties(imgData);
  const imgWidth = pageWidth;
  const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

  let y = 0;
  let remaining = imgHeight;
  pdf.addImage(imgData, "PNG", 0, y, imgWidth, imgHeight);
  remaining -= pageHeight;

  while (remaining > 0) {
    pdf.addPage();
    y = -(imgHeight - remaining);
    pdf.addImage(imgData, "PNG", 0, y, imgWidth, imgHeight);
    remaining -= pageHeight;
  }

  onProgress?.("Saving download…");
  pdf.save(filename);
}

export function buildPublicResultPdfFilename(data: {
  testName: string;
  studentName: string;
  cstNumber: string;
}): string {
  const safe = (s: string) =>
    s
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-") || "result";
  return `${safe(data.testName)}-${safe(data.studentName)}-${safe(data.cstNumber)}-result.pdf`;
}
