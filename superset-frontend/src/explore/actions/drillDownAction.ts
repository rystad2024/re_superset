import { Dispatch } from 'redux';
import { getDatasourceSamples } from 'src/components/Chart/chartAction';
import { getDrillPayload } from 'src/components/Chart/DrillDetail/utils';
import * as XLSX from 'xlsx';

export const SET_DRILLDOWN_DATA = 'SET_DRILLDOWN_DATA';

// Action Interface
export interface SetDrilldownData {
  type: typeof SET_DRILLDOWN_DATA;
  chartId: number;
  data: any;
}

// Action Creator
export function setDrilldownData(chartId: number, data: any): SetDrilldownData {
  return { type: SET_DRILLDOWN_DATA, chartId, data };
}

// Fetch drill-down data for a single chart
async function fetchSingleChartDrillData(
  chartId: number,
  formData: any,
  dispatch: Dispatch,
) {
  try {
    const datasourceType = formData.datasource.split('__')[1];
    const datasourceId = parseInt(formData.datasource.split('__')[0], 10);
    const jsonPayload = getDrillPayload(formData, []);
    const perPage = 500; // Number of records per request

    console.log(`🚀 Fetching drill-down data for Chart ${chartId}...`);

    // Fetch first page to get total count
    const firstResponse = await getDatasourceSamples(
      datasourceType,
      datasourceId,
      false,
      jsonPayload,
      perPage,
      1,
    );

    if (!firstResponse?.data?.length) {
      console.warn(`⚠️ No data found for Chart ${chartId}.`);
      return [];
    }

    const totalRecords = firstResponse.total_count;
    const totalPages = Math.ceil(totalRecords / perPage);
    console.log(
      `✅ Chart ${chartId}: Total records: ${totalRecords}, Total pages: ${totalPages}`,
    );

    let allData = [...firstResponse.data];

    const batchSize = 5; // Number of parallel API calls
    let processedPages = 1;

    for (let i = 2; i <= totalPages; i += batchSize) {
      const batchRequests = [];

      for (let j = 0; j < batchSize && i + j <= totalPages; j++) {
        batchRequests.push(
          getDatasourceSamples(
            datasourceType,
            datasourceId,
            false,
            jsonPayload,
            perPage,
            i + j,
          ),
        );
      }

      console.log(`📡 Fetching batch starting from page ${i}...`);

      const responses = await Promise.all(batchRequests);

      responses.forEach(response => {
        if (response?.data?.length) {
          allData = [...allData, ...response.data];
        }
      });

      processedPages += responses.length;
      console.log(
        `📊 Fetched ${processedPages}/${totalPages} pages for Chart ${chartId}`,
      );
    }

    console.log(`✅ Completed fetching all data for Chart ${chartId}.`);
    dispatch(setDrilldownData(chartId, allData));

    return allData;
  } catch (error) {
    console.error(
      `❌ Error fetching drill-down data for Chart ${chartId}:`,
      error,
    );
    return [];
  }
}

// Fetch drill-down data for **all charts** on dashboard load
export function fetchAllDrilldownData(
    chartsData: any,
    progressCallback?: (progress: number) => void
  ) {
    return async function (dispatch: Dispatch) {
      const chartEntries = Object.entries(chartsData);
      const totalCharts = chartEntries.length;
      let processedCharts = 0;
  
      const drillDownResults: Record<number, any[]> = {};
  
      for (const [chartId, chart] of chartEntries) {
        const data = await fetchSingleChartDrillData(
          Number(chartId),
          (chart as any).form_data,
          dispatch
        );
  
        if (data !== undefined) {
          drillDownResults[Number(chartId)] = data;
          dispatch(setDrilldownData(Number(chartId), data));
        }
  
        processedCharts++;
        const progress = Math.round((processedCharts / totalCharts) * 100);
        if (progressCallback) {
          progressCallback(progress);
        }
      }
  
      return drillDownResults; // Return all processed data
    };
  }
  
  
  

// Export Actions
export const drilldownActions = {
  setDrilldownData,
  fetchAllDrilldownData,
};

export type AnyDrilldownAction = SetDrilldownData;
