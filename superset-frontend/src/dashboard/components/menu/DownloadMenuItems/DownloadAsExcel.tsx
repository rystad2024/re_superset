import { SyntheticEvent, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logging, t } from "@superset-ui/core";
import { Menu } from "src/components/Menu";
import { useToasts } from "src/components/MessageToasts/withToasts";
import { fetchAllDrilldownData } from "src/explore/actions/drillDownAction";
import { RootState } from "src/views/store";
import ProgressBar from "src/components/ProgressBar";

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
    const chartsData = useSelector((state: RootState) => state.charts);
    const chartsMetadata = useSelector((state: RootState) => state.sliceEntities?.slices || {});

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
                fetchAllDrilldownData(chartsData, setDownloadProgress, () => {
                    addSuccessToast(t("Data fetching completed. Now exporting to Excel..."));
                    setDownloadProgress(50); // **Ensure progress stays at 50% before the worker starts**
                })
            );

            if (!workerRef.current) {
                workerRef.current = new Worker(new URL("src/webworkers/exportWorker.js", import.meta.url), { type: "module" });
            }

            workerRef.current.onmessage = (event) => {
                const { type, success, blob, progress } = event.data;

                if (type === "progress") {
                    setDownloadProgress(progress); // Progress from 50% → 100%
                } else if (type === "complete" && success && blob) {
                    const url = URL.createObjectURL(blob);
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
                }
            };

            workerRef.current.postMessage({ type: "init", totalCharts: Object.keys(allDrillData).length });

            Object.entries(allDrillData).forEach(([chartId, chartData]) => {
                const chartName = chartsMetadata[chartId]?.slice_name || `Chart_${chartId}`;
                workerRef.current?.postMessage({ type: "chunk", chartId, chartName, chartData });
            });

            workerRef.current?.postMessage({ type: "done" });

        } catch (error) {
            logging.error(error);
            addDangerToast(t("Something went wrong while exporting."));
        }
    };


    return (
        <Menu.Item key="download-zip" onClick={(e) => onDownloadZip(e.domEvent)}>
            {text}
            {downloadProgress !== null && <ProgressBar percent={downloadProgress} striped />}
        </Menu.Item>
    );
}
