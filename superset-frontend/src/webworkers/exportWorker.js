// console.log("Worker: Initialized and ready!");
importScripts("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js");
importScripts("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");

const zip = new JSZip();
let processedCharts = 0;
let totalCharts = 1; 
const usedSheetNames = new Set();

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
    const { type, chartId, chartName, chartData, total } = event.data;

    if (type === "init") {
        totalCharts = total > 0 ? total : 1;
        processedCharts = 0;
        // console.log(`Worker: Preparing to process ${totalCharts} charts.`);
        self.postMessage({ type: "progress", progress: 50 }); 

    } else if (type === "chunk") {
        // console.log(`Worker: Processing chart ${chartName} (${chartId}) with ${chartData.length} rows`);

        if (!Array.isArray(chartData) || chartData.length === 0) return;

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(chartData);
        const sanitizedBaseName = chartName.replace(/[:\\\/\?\*\[\]]/g, "_").substring(0, 25);
        const uniqueSheetName = getUniqueSheetName(sanitizedBaseName, chartId);

        XLSX.utils.book_append_sheet(workbook, worksheet, uniqueSheetName);

        const sanitizedChartName = chartName.replace(/[:\\\/\?\*\[\]]/g, "_");
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

        const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        zip.file(`widgets/${sanitizedChartName}.xlsx`, blob);

        processedCharts++;

        const progressSteps = [60, 75, 85, 90]; 
        let stepIndex = Math.min(processedCharts - 1, progressSteps.length - 1); 
        let progress = progressSteps[stepIndex];

        // console.log(`Worker: Progress updated to ${progress}%`);
        self.postMessage({ type: "progress", progress });

    } else if (type === "done") {
        // console.log("Worker: All charts processed, creating final ZIP file...");

        let zipProgress = 90;
        const interval = setInterval(() => {
            zipProgress += 2;
            if (zipProgress >= 100) {
                clearInterval(interval);
                zipProgress = 100;
            }
            self.postMessage({ type: "progress", progress: zipProgress });
        }, 400); 

        zip.generateAsync({ type: "blob" }).then((finalZipBlob) => {
            clearInterval(interval);
            // console.log("Worker: ZIP file created, sending to main thread...");
            self.postMessage({ type: "progress", progress: 100 }); 
            self.postMessage({ type: "complete", success: true, blob: finalZipBlob });
        }).catch((error) => {
            clearInterval(interval);
            console.error("Worker: ZIP creation failed", error);
            self.postMessage({ type: "error", success: false, error: error.message });
        });
    }
};
