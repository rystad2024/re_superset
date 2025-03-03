import { isFeatureEnabled, FeatureFlag, t, useTheme } from '@superset-ui/core';
import { Link, useHistory } from 'react-router-dom';
import Icons from 'src/components/Icons';
import ListViewCard from 'src/components/ListViewCard';
import Label from 'src/components/Label';
import { Dropdown } from 'src/components/Dropdown';
import { Menu } from 'src/components/Menu';
import FacePile from 'src/components/FacePile';
import { CardStyles } from 'src/views/CRUD/utils';
import Button from 'src/components/Button';
import type { Dataset } from 'src/pages/DatasetList';

interface DatasetCardProps {
  dataset: Dataset;
  hasPerm: (perm: string) => boolean;
  openDatasetEditModal: ({ id }: Dataset) => void;
  openDatasetDeleteModal: (dataset: Dataset) => Promise<void>;
  bulkSelectEnabled: boolean;
  addDangerToast: (msg: string) => void;
  addSuccessToast: (msg: string) => void;
  refreshData: () => void;
  loading?: boolean;
  saveFavoriteStatus?: (id: number, isStarred: boolean) => void;
  favoriteStatus?: boolean;
  datasetFilter?: string;
  userId?: string | number;
  showThumbnails?: boolean;
  handleBulkDatasetExport: (datasetsToExport: Dataset[]) => void;
}

export default function DatasetCard({
  dataset,
  hasPerm,
  openDatasetEditModal,
  openDatasetDeleteModal,
  bulkSelectEnabled,
  addDangerToast,
  addSuccessToast,
  refreshData,
  loading,
  showThumbnails,
  saveFavoriteStatus,
  favoriteStatus,
  datasetFilter,
  userId,
  handleBulkDatasetExport,
}: DatasetCardProps) {
  const history = useHistory();
  const canEdit = hasPerm('can_write');
  const canDelete = hasPerm('can_write');
  const canExport = hasPerm('can_export');
  const theme = useTheme();

  const menu = (
    <Menu>
      {canDelete && (
        <Menu.Item>
          <div
            data-test="dataset-list-delete-option"
            role="button"
            tabIndex={0}
            className="action-button"
            onClick={() => openDatasetDeleteModal(dataset)}
          >
            <Icons.Trash iconSize="l" /> {t('Delete')}
          </div>
        </Menu.Item>
      )}
      {canExport && (
        <Menu.Item>
          <div
            role="button"
            tabIndex={0}
            onClick={() => handleBulkDatasetExport([dataset])}
          >
            <Icons.Share iconSize="l" /> {t('Export')}
          </div>
        </Menu.Item>
      )}
      {canEdit && (
        <Menu.Item>
          <div
            data-test="dataset-list-edit-option"
            role="button"
            tabIndex={0}
            onClick={() => openDatasetEditModal(dataset)}
          >
            <Icons.EditAlt iconSize="l" /> {t('Edit')}
          </div>
        </Menu.Item>
      )}
    </Menu>
  );

  return (
    <CardStyles
      onClick={() => {
        if (!bulkSelectEnabled && dataset.explore_url) {
          history.push(dataset.explore_url);
        }
      }}
    >
      <ListViewCard
        loading={loading}
        title={dataset.table_name}
        certifiedBy={dataset.certified_by}
        certificationDetails={dataset.certification_details}
        cover={
          !isFeatureEnabled(FeatureFlag.Thumbnails) || !showThumbnails ? (
            <></>
          ) : null
        }
        url={bulkSelectEnabled ? undefined : dataset.explore_url}
        imgFallbackURL="/static/assets/images/dataset-fallback.svg"
        description={t('Modified %s', dataset.changed_on_delta_humanized)}
        coverLeft={<FacePile users={dataset.owners || []} />}
        coverRight={
          <>
            <Label type="secondary">
              {' '}
              {dataset.database?.database_name || 'Unknown Database'}
            </Label>
            {/* {dataset.schema && (
              <Label type="secondary" className="ml-1">
                {dataset.schema}
              </Label>
            )}
            {dataset.kind && (
              <DatasetTypeLabel datasetType={dataset.kind} />
            )} */}
          </>
        }
        linkComponent={Link}
        actions={
          <ListViewCard.Actions
            onClick={e => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            {/* {userId && (
              <FaveStar
                itemId={dataset.id}
                saveFaveStar={saveFavoriteStatus}
                isStarred={favoriteStatus}
              />
            )} */}
            <Dropdown dropdownRender={() => menu} trigger={['click', 'hover']}>
              <Button buttonSize="xsmall" type="link">
                <Icons.MoreVert iconColor={theme.colors.grayscale.base} />
              </Button>
            </Dropdown>
          </ListViewCard.Actions>
        }
      />
    </CardStyles>
  );
}
