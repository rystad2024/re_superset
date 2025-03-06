console.log("Worker: 🚀 Initialized and ready!");

importScripts("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js");
importScripts("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");

const zip = new JSZip();
let processedCharts = 0;
let totalCharts = 0;
const usedSheetNames = new Set(); // Track used sheet names

// Function to sanitize and ensure sheet name uniqueness
function getUniqueSheetName(baseName, chartId) {
    let name = `${baseName}_${chartId}`.substring(0, 31);
    let counter = 1;

    while (usedSheetNames.has(name)) {
        name = `${baseName}_${chartId}_${counter}`.substring(0, 31);
        counter++;
    }

    usedSheetNames.add(name);
    return name;
}

self.onmessage = async function (event) {
    const { type, chartId, chartName, chartData } = event.data;

    if (type === "chunk") {
        console.log(`Worker: Processing chart ${chartName} (${chartId}) with ${chartData.length} rows`);

        if (!Array.isArray(chartData) || chartData.length === 0) return;

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(chartData);

        // Sanitize chart name and ensure uniqueness
        const sanitizedBaseName = chartName.replace(/[:\\\/\?\*\[\]]/g, "_").substring(0, 25);
        const uniqueSheetName = getUniqueSheetName(sanitizedBaseName, chartId);

        XLSX.utils.book_append_sheet(workbook, worksheet, uniqueSheetName);

        // Sanitize filename separately (no 31-char limit for filenames)
        const sanitizedChartName = chartName.replace(/[:\\\/\?\*\[\]]/g, "_");
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

        const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        zip.file(`widgets/${sanitizedChartName}.xlsx`, blob);

        processedCharts++;
        self.postMessage({ type: "progress", progress: Math.round((processedCharts / totalCharts) * 100) });

    } else if (type === "done") {
        console.log("Worker: All charts processed, creating final ZIP file...");

        zip.generateAsync({ type: "blob" }).then((finalZipBlob) => {
            console.log("Worker: Sending final ZIP file to main thread...");
            self.postMessage({ type: "complete", success: true, blob: finalZipBlob });
        }).catch((error) => {
            console.error("Worker: ZIP creation failed", error);
            self.postMessage({ type: "error", success: false, error: error.message });
        });
    }
};
