import {
  useState,
  forwardRef,
  useImperativeHandle,
  type RefObject,
  useEffect,
} from 'react';

import { Checkbox } from 'antd-v5';
import { Filter, SelectOption } from 'src/components/ListView/types';
import { FormLabel } from 'src/components/Form';
import { FilterContainer, BaseFilter, FilterHandler } from './Base';
import { styled } from '@superset-ui/core';

const CheckboxContainer = styled.div`
  display: flex;
  gap: 8px;
  padding: 8px 0;
  width: auto;
`;

interface CheckboxFilterProps extends BaseFilter {
  name?: string;
  onSelect: (selected: SelectOption | undefined, isClear?: boolean) => void;
  selects: Filter['selects'];
}

function CheckboxFilter(
  { Header, name, initialValue, onSelect, selects = [] }: CheckboxFilterProps,
  ref: RefObject<FilterHandler>,
) {
  // Initialize with all values selected by default for boolean filters with exactly 2 options
  const isDefaultBooleanFilter =
    selects.length === 2 &&
    typeof selects[0].value === 'boolean' &&
    typeof selects[1].value === 'boolean';

  const getInitialSelectedValues = () => {
    if (initialValue) {
      // If there's an initial value set, use it
      return new Set([initialValue.value]);
    } else if (isDefaultBooleanFilter) {
      // For boolean filters with no initial value, select both by default
      return new Set(selects.map(option => option.value));
    }
    return new Set();
  };

  // Track selected values in a Set for efficient lookup
  const [selectedValues, setSelectedValues] = useState<Set<any>>(
    getInitialSelectedValues(),
  );

  const toggleOption = (option: SelectOption) => {
    const newSelectedValues = new Set(selectedValues);

    if (newSelectedValues.has(option.value)) {
      // Remove if already selected
      newSelectedValues.delete(option.value);
    } else {
      // Add if not selected
      newSelectedValues.add(option.value);
    }

    setSelectedValues(newSelectedValues);

    // For boolean filters with exactly two options (like Published/Draft)
    if (isDefaultBooleanFilter) {
      if (newSelectedValues.size === selects.length) {
        // If all options are selected, clear the filter (show everything)
        onSelect(undefined, true);
      } else if (newSelectedValues.size === 1) {
        // If only one is selected, filter for that value
        const selectedOption = selects.find(opt =>
          newSelectedValues.has(opt.value),
        );
        onSelect(selectedOption);
      } else if (newSelectedValues.size === 0) {
        // If none are selected, show nothing (or could revert to showing everything)
        // This is a UX decision - here we choose to show nothing when no checkboxes are checked
        // Alternative approach: onSelect(undefined, true) to show everything
        const invertedOption = selects.find(
          opt => !newSelectedValues.has(opt.value),
        );
        onSelect(invertedOption);
      }
    } else {
      // For other types of filters, use the standard behavior
      if (newSelectedValues.size > 0) {
        // For compatibility, send the option object of the first selected value
        const firstSelectedValue = Array.from(newSelectedValues)[0];
        const selectedOption = selects.find(
          opt => opt.value === firstSelectedValue,
        );
        onSelect(selectedOption);
      } else {
        // Clear if nothing selected
        onSelect(undefined, true);
      }
    }
  };

  const clearFilter = () => {
    // When clearing, for boolean filters, select all options (which clears the filter)
    if (isDefaultBooleanFilter) {
      setSelectedValues(new Set(selects.map(option => option.value)));
    } else {
      setSelectedValues(new Set());
    }
    onSelect(undefined, true);
  };

  useImperativeHandle(ref, () => ({
    clearFilter,
  }));

  // Reset to initial state when filters are externally cleared
  useEffect(() => {
    if (initialValue === undefined) {
      if (isDefaultBooleanFilter) {
        setSelectedValues(new Set(selects.map(option => option.value)));
      } else {
        setSelectedValues(new Set());
      }
    } else if (initialValue && !selectedValues.has(initialValue.value)) {
      setSelectedValues(new Set([initialValue.value]));
    }
  }, [initialValue, isDefaultBooleanFilter, selects]);

  return (
    <FilterContainer>
      <div>
        <FormLabel>{Header}</FormLabel>
        <CheckboxContainer data-test="filters-checkbox">
          {selects.map(option => (
            <Checkbox
              key={option.value.toString()}
              checked={selectedValues.has(option.value)}
              onChange={() => toggleOption(option)}
            >
              {option.label}
            </Checkbox>
          ))}
        </CheckboxContainer>
      </div>
    </FilterContainer>
  );
}

export default forwardRef(CheckboxFilter);
