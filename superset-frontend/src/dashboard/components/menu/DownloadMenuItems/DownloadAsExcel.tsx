import { SyntheticEvent, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logging, t } from "@superset-ui/core";
import { Menu } from "src/components/Menu";
import { useToasts } from "src/components/MessageToasts/withToasts";
import { fetchAllDrilldownData } from "src/explore/actions/drillDownAction";
import { RootState } from "src/views/store";
import * as XLSX from "xlsx";
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

  // Redux State
  const chartsData = useSelector((state: RootState) => state.charts);

  // State for Progress
  const [isFetching, setIsFetching] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

  // Function to Export Data to Excel
  const exportToExcel = (data: Record<number, any[]>) => {
    const workbook = XLSX.utils.book_new();

    Object.entries(data).forEach(([chartId, chartData]) => {
      if (!Array.isArray(chartData) || chartData.length === 0) {
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(chartData);
      XLSX.utils.book_append_sheet(workbook, worksheet, `Chart_${chartId}`);
    });

    XLSX.writeFile(workbook, "Drilldown_Data.xlsx");
    addSuccessToast(t("Excel file has been downloaded successfully!"));
    setDownloadProgress(null);
  };

  // Download Excel Function
  const onDownloadExcel = async (e: SyntheticEvent) => {
    try {
      e.preventDefault();

      if (!chartsData || Object.keys(chartsData).length === 0) {
        addDangerToast(t("No chart data available."));
        return;
      }

      setDownloadProgress(0);
      setIsFetching(true);

      // Wait for all data before exporting
      const allDrillData = await dispatch<any>(
        fetchAllDrilldownData(chartsData, (progress: number) => {
          setDownloadProgress(progress);
        })
      );

      exportToExcel(allDrillData); // Export once all data is ready

      setIsFetching(false);
      setDownloadProgress(null);
    } catch (error) {
      logging.error(error);
      setDownloadProgress(null);
      addDangerToast(t("Sorry, something went wrong. Try again later."));
    }

    logEvent?.("DASHBOARD_DOWNLOAD_AS_EXCEL");
  };

  return (
    <Menu.Item key="download-excel" onClick={(e) => onDownloadExcel(e.domEvent)}>
      {text}
      {downloadProgress !== null && (
        <ProgressBar percent={downloadProgress} striped />
      )}
    </Menu.Item>
  );
}
