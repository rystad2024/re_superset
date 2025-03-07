import { SyntheticEvent, useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logging, t } from "@superset-ui/core";
import { Menu } from "src/components/Menu";
import { useToasts } from "src/components/MessageToasts/withToasts";
import { fetchAllDrilldownData } from "src/explore/actions/drillDownAction";
import { RootState } from "src/views/store";
import ProgressBar from "src/components/ProgressBar";
import { use } from "echarts/types/src/extension";

export default function DownloadAsExcel({
    text,
    logEvent,
    dashboardTitle,
}: {
    text: string;
    dashboardTitle: string;
    logEvent?: Function;
}) {
    const { addDangerToast, addSuccessToast } = useToasts();
    const dispatch = useDispatch();

    const drillDownData = useSelector((state: RootState) => state.drillDownData);
    console.log("DownloadAsExcel: drillDownData =", drillDownData.workspaceTitle);

    // Redux State
    const chartsData = useSelector((state: RootState) => state.charts);
    const chartsMetadata = useSelector(
        (state: RootState) => state.sliceEntities?.slices || {} // Moved to top-level
    );

    // State for Progress
    const [isFetching, setIsFetching] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
    const workerRef = useRef<Worker | null>(null);

    const onDownloadZip = async (e: SyntheticEvent) => {
        e.preventDefault();

        if (!chartsData || Object.keys(chartsData).length === 0) {
            addDangerToast(t("No chart data available."));
            return;
        }

        setDownloadProgress(0);
        setIsFetching(true);

        try {
            const allDrillData = await dispatch<any>(
                fetchAllDrilldownData(chartsData, (progress: number) => {
                    setDownloadProgress(progress);
                })
            );

            if (!workerRef.current) {
                workerRef.current = new Worker(new URL("src/webworkers/exportWorker.js", import.meta.url), { type: "module" });
            }

            workerRef.current.onmessage = (event) => {
                const { type, success, blob, progress, error } = event.data;

                if (type === "progress") {
                    setDownloadProgress(progress);
                } else if (type === "complete" && success && blob) {
                    console.log("Main thread: Received ZIP file from worker", blob);
                    console.log("Main thread: Blob size", blob.size);

                    if (blob.size === 0) {
                        console.error("Main thread: Received an empty ZIP file! Something is wrong.");
                        addDangerToast(t("File download failed: The generated file is empty."));
                        return;
                    }

                    const url = URL.createObjectURL(blob);
                    console.log("Main thread: File URL", url);

                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${drillDownData?.workspaceTitle}.zip`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    addSuccessToast(t("ZIP file has been downloaded successfully!"));
                    setDownloadProgress(null);
                    setIsFetching(false);
                } else if (type === "error") {
                    console.error("Main thread: Export failed", error);
                    addDangerToast(t("Something went wrong while exporting."));
                    setDownloadProgress(null);
                    setIsFetching(false);
                }
            };

            console.log("Main thread: Sending data to worker in chunks...");

            workerRef.current.postMessage({ type: "init", chartId: Object.keys(allDrillData).length });

            // Send data chart-by-chart to the worker
            Object.entries(allDrillData).forEach(([chartId, chartData], index, array) => {
                const chartName = chartsMetadata[chartId]?.slice_name || `Chart_${chartId}`;

                workerRef.current?.postMessage({ type: "chunk", chartId, chartName, chartData });

                setTimeout(() => {
                    if (index === array.length - 1) {
                        workerRef.current?.postMessage({ type: "done" });
                    }
                }, 50);
            });

        } catch (error) {
            logging.error(error);
            setDownloadProgress(null);
            addDangerToast(t("Sorry, something went wrong. Try again later."));
        }

        logEvent?.("DASHBOARD_DOWNLOAD_AS_ZIP");
    };

    return (
        <Menu.Item key="download-zip" onClick={(e) => onDownloadZip(e.domEvent)}>
            {text}
            {downloadProgress !== null && <ProgressBar percent={downloadProgress} striped />}
        </Menu.Item>
    );
}
