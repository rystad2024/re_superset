import {
  useState,
  forwardRef,
  useImperativeHandle,
  type RefObject,
  useEffect,
} from 'react';

import { Tooltip, Button } from 'antd-v5';
import {
  FileTextOutlined,
  EditOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { Filter, SelectOption } from 'src/components/ListView/types';
import { FormLabel } from 'src/components/Form';
import { FilterContainer, BaseFilter, FilterHandler } from './Base';
import { styled } from '@superset-ui/core';
import Icons from 'src/components/Icons';

// const ToggleContainer = styled.div`
//   display: flex;
//   align-items: center;
//   gap: 4px;
//   padding: 8px 0;
// `;

const IconButtonsContainer = styled.div`
  display: flex;
  padding: 0;
  border: solid 1px #bfbfbf;
  border-radius: 12px;
  gap: 0;
`;

const StyledIconButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  padding: 0;
  margin: 0;
  border-radius: 10px;
  border: none;

  &.active {
    background-color: ${({ theme }) => theme.colors.secondary.light1};
    border-color: ${({ theme }) => theme.colors.grayscale.light2};
    color: ${({ theme }) => theme.colors.primary.base};
  }
`;

const StyledIcon = styled(Button)`
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 !important;
  background-color: transparent;
  font-size: 24px;
  &.active {
    background-color: ${({ theme }) => theme.colors.secondary.light1};
    border-color: ${({ theme }) => theme.colors.grayscale.light2};
    // color: ${({ theme }) => theme.colors.primary.base};
  }
`;

interface ToggleFilterProps extends BaseFilter {
  name?: string;
  onSelect: (selected: SelectOption | undefined, isClear?: boolean) => void;
  selects: Filter['selects'];
  filterType: 'toggle' | 'icon';
  iconType?: 'status' | 'certified' | 'favorite' | 'type';
}

function ToggleFilter(
  {
    Header,
    initialValue,
    onSelect,
    selects = [],
    filterType = 'toggle',
    iconType,
  }: ToggleFilterProps,
  ref: RefObject<FilterHandler>,
) {
  // Find the "true" option for toggle filters
  const trueOption = selects.find(option => option.value === true);

  // For icon filters, find both options
  const publishedOption = selects.find(option => option.value === true);
  const draftOption = selects.find(option => option.value === false);

  // Initialize state based on initialValue
  const [isActive, setIsActive] = useState<boolean>(
    initialValue?.value === true,
  );

  // For status filter - track which one is selected (if any)
  const [selectedStatus, setSelectedStatus] = useState<boolean | null>(
    initialValue?.value === true
      ? true
      : initialValue?.value === false
        ? false
        : null,
  );

  const handleToggleChange = (checked: boolean) => {
    setIsActive(checked);

    if (checked && trueOption) {
      // When toggled on, filter for the "true" value
      onSelect(trueOption);
    } else {
      // When toggled off, clear the filter
      onSelect(undefined, true);
    }
  };

  // Handle icon button click for status
  const handleStatusClick = (value: boolean) => {
    if (selectedStatus === value) {
      // If already selected, clear the filter
      setSelectedStatus(null);
      onSelect(undefined, true);
    } else {
      setSelectedStatus(value);
      const option = value ? publishedOption : draftOption;
      if (option) {
        onSelect(option);
      }
    }
  };

  const clearFilter = () => {
    if (filterType === 'toggle') {
      setIsActive(false);
    } else if (filterType === 'icon') {
      setSelectedStatus(null);
    }
    onSelect(undefined, true);
  };

  useImperativeHandle(ref, () => ({
    clearFilter,
  }));

  // Reset to initial state when filters are externally cleared
  useEffect(() => {
    if (initialValue === undefined) {
      if (filterType === 'toggle') {
        setIsActive(false);
      } else if (filterType === 'icon') {
        setSelectedStatus(null);
      }
    } else if (initialValue) {
      if (filterType === 'toggle') {
        setIsActive(initialValue.value === true);
      } else if (filterType === 'icon') {
        setSelectedStatus(
          initialValue.value === true
            ? true
            : initialValue.value === false
              ? false
              : null,
        );
      }
    }
  }, [initialValue, filterType]);

  const getToggleIcon = () => {
    if (iconType === 'certified') {
      return (
        <CheckCircleOutlined
          style={{
            color: isActive ? 'inherit' : '#B2B2B2',
          }}
        />
      );
    } else if (iconType === 'favorite') {
      {
        return isActive ? (
          <Icons.FavoriteSelected
            style={{ fontSize: '36px', paddingTop: '2px' }}
          />
        ) : (
          <Icons.FavoriteUnselected style={{ fontSize: '36px' }} />
        );
      }
    }
    return null;
  };

  // Render the appropriate filter type
  const renderFilterControl = () => {
    if (filterType === 'toggle') {
      return (
        <StyledIcon
          icon={iconType && filterType === 'toggle' && getToggleIcon()}
          onClick={() => handleToggleChange(!isActive)}
        />
      );
    } else if (filterType === 'icon' && iconType === 'status') {
      return (
        <IconButtonsContainer data-test="filters-status">
          <Tooltip title={publishedOption?.label || 'Published'}>
            <StyledIconButton
              className={selectedStatus === true ? 'active' : ''}
              icon={<FileTextOutlined />}
              onClick={() => handleStatusClick(true)}
            />
          </Tooltip>
          <Tooltip title={draftOption?.label || 'Draft'}>
            <StyledIconButton
              className={selectedStatus === false ? 'active' : ''}
              icon={<EditOutlined />}
              onClick={() => handleStatusClick(false)}
            />
          </Tooltip>
        </IconButtonsContainer>
      );
    } else if (filterType === 'icon' && iconType === 'type') {
      return (
        <IconButtonsContainer data-test="filters-status">
          <Tooltip title={publishedOption?.label || 'Published'}>
            <StyledIconButton
              className={selectedStatus === true ? 'active' : ''}
              icon={<Icons.Table />}
              onClick={() => handleStatusClick(true)}
            />
          </Tooltip>
          <Tooltip title={draftOption?.label || 'Draft'}>
            <StyledIconButton
              className={selectedStatus === false ? 'active' : ''}
              icon={<Icons.ConsoleSqlOutlined />}
              onClick={() => handleStatusClick(false)}
            />
          </Tooltip>
        </IconButtonsContainer>
      );
    }

    return null;
  };

  return (
    <FilterContainer>
      <div>
        <FormLabel>{Header}</FormLabel>
        {renderFilterControl()}
      </div>
    </FilterContainer>
  );
}

export default forwardRef(ToggleFilter);
