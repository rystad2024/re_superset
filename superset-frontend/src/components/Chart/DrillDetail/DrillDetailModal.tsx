/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { useCallback, useContext, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  BinaryQueryObjectFilterClause,
  css,
  QueryFormData,
  t,
  useTheme,
} from '@superset-ui/core';
import Modal from 'src/components/Modal';
import Button from 'src/components/Button';
import { useSelector } from 'react-redux';
import { DashboardPageIdContext } from 'src/dashboard/containers/DashboardPage';
import { Slice } from 'src/types/Chart';
import { RootState } from 'src/dashboard/types';
import { findPermission } from 'src/utils/findPermission';
import DrillDetailPane from './DrillDetailPane';
import ProgressBar from 'src/components/ProgressBar';
import * as XLSX from 'xlsx'; // Added XLSX import
import { getDatasourceSamples } from '../chartAction';
import { getDrillPayload } from './utils';


interface ModalFooterProps {
  canExplore: boolean;
  closeModal?: () => void;
  exploreChart: () => void;
  downloadExcelData: () => void;
  downloadProgress: number | null; 

}

const ModalFooter = ({
  canExplore,
  closeModal,
  exploreChart,
  downloadExcelData,
  downloadProgress,
}: ModalFooterProps) => {
  const theme = useTheme();

  return (
    <>
      <Button
        buttonStyle="secondary"
        buttonSize="small"
        onClick={downloadExcelData}
        data-test="close-drilltodetail-modal"
        css={css`
          margin-left: ${theme.gridUnit * 2}px;
        `}
      >
        {t('Download Widget Data')}
      </Button>
      <Button
        buttonStyle="secondary"
        buttonSize="small"
        onClick={exploreChart}
        disabled={!canExplore}
        tooltip={
          !canExplore
            ? t('You do not have sufficient permissions to edit the chart')
            : undefined
        }
      >
        {t('Edit chart')}
      </Button>
      <Button
        buttonStyle="primary"
        buttonSize="small"
        onClick={closeModal}
        data-test="close-drilltodetail-modal"
        css={css`
          margin-left: ${theme.gridUnit * 2}px;
        `}
      >
        {t('Close')}
      </Button>
      {downloadProgress !== null && (
        <ProgressBar
          percent={downloadProgress}
          striped
          css={css`
            margin-top: ${theme.gridUnit}px;
            width: 100%;
          `}
        />
      )}
    </>
  );
};

interface DrillDetailModalProps {
  chartId: number;
  formData: QueryFormData;
  initialFilters: BinaryQueryObjectFilterClause[];
  showModal: boolean;
  onHideModal: () => void;
}

export default function DrillDetailModal({
  chartId,
  formData,
  initialFilters,
  showModal,
  onHideModal,
}: DrillDetailModalProps) {
  const theme = useTheme();
  const history = useHistory();
  const dashboardPageId = useContext(DashboardPageIdContext);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null); // Track progress

  const { slice_name: chartName } = useSelector(
    (state: { sliceEntities: { slices: Record<number, Slice> } }) =>
      state.sliceEntities?.slices?.[chartId] || {},
  );
  const canExplore = useSelector((state: RootState) =>
    findPermission('can_explore', 'Superset', state.user?.roles),
  );

  const exploreUrl = useMemo(
    () => `/explore/?dashboard_page_id=${dashboardPageId}&slice_id=${chartId}`,
    [chartId, dashboardPageId],
  );

  const exploreChart = useCallback(() => {
    history.push(exploreUrl);
  }, [exploreUrl, history]);

  const downloadExcelData = useCallback(async () => {
    setDownloadProgress(0); 
  
    try {
      const jsonPayload = getDrillPayload(formData, initialFilters) ?? {};
      const perPage = 1000; // Number of records per API request
      const datasourceType = formData.datasource.split('__')[1];
      const datasourceId = parseInt(formData.datasource.split('__')[0], 10);
  
      //console.log('Starting data fetch for Excel export...');
  
      const firstResponse = await getDatasourceSamples(
        datasourceType,
        datasourceId,
        false,
        jsonPayload,
        perPage,
        1
      );
  
      if (!firstResponse?.data?.length) {
        console.warn("No data to export.");
        setDownloadProgress(null);
        return;
      }
  
      const totalRecords = firstResponse.total_count;
      const totalPages = Math.ceil(totalRecords / perPage);
      //console.log(`Total records: ${totalRecords}, Total pages: ${totalPages}`);
  
      let allData = [...firstResponse.data];
  
      const batchSize = 5; 
      let processedPages = 1; 
  
      for (let i = 2; i <= totalPages; i += batchSize) {
        const batchRequests = [];
  
        for (let j = 0; j < batchSize && i + j <= totalPages; j++) {
          batchRequests.push(
            getDatasourceSamples(datasourceType, datasourceId, false, jsonPayload, perPage, i + j)
          );
        }
  
        // console.log(`Fetching batch starting from page ${i}...`);
  
        const responses = await Promise.all(batchRequests);
  
        responses.forEach((response) => {
          if (response?.data?.length) {
            allData = [...allData, ...response.data]; 
          }
        });
  
        processedPages += responses.length;
        const progress = Math.round((processedPages / totalPages) * 100);
        setDownloadProgress(progress > 100 ? 100 : progress);
      }
  
      // console.log("Data successfully stored. Generating Excel file...");
  
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(allData);
      const sanitizedChartName = chartName.replace(/[:\\\/\?\*\[\]]/g, "_");
      XLSX.utils.book_append_sheet(workbook, worksheet, sanitizedChartName.substring(0, 31));
  
      XLSX.writeFile(workbook, `${chartName}.xlsx`);
  
      // console.log("Excel file generated and downloaded.");
  
      setDownloadProgress(100);
  
      setTimeout(() => {
        setDownloadProgress(null);
      }, 1000);
  
    } catch (error) {
      console.error("Error during Excel export:", error);
      setDownloadProgress(null);
    }
  }, [formData, initialFilters]);
  

  return (
    <Modal
      show={showModal}
      onHide={onHideModal ?? (() => null)}
      css={css`
        .antd5-modal-body {
          display: flex;
          flex-direction: column;
        }
      `}
      title={t('Drill to detail: %s', chartName)}
      footer={
        <ModalFooter exploreChart={exploreChart} canExplore={canExplore} downloadExcelData={downloadExcelData} downloadProgress={downloadProgress}/>
      }
      responsive
      resizable
      resizableConfig={{
        minHeight: theme.gridUnit * 128,
        minWidth: theme.gridUnit * 128,
        defaultSize: {
          width: 'auto',
          height: '75vh',
        },
      }}
      draggable
      destroyOnClose
      maskClosable={false}
    >
      <DrillDetailPane formData={formData} initialFilters={initialFilters} />
    </Modal>
  );
}
