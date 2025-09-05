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
import {
  ChangeEventHandler,
  FC,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import Fuse from 'fuse.js';
import cx from 'classnames';
import {
  t,
  styled,
  css,
  ChartMetadata,
  SupersetTheme,
  useTheme,
  chartLabelWeight,
  chartLabelExplanations,
} from '@superset-ui/core';
import { AntdCollapse } from 'src/components';
import { Tooltip } from 'src/components/Tooltip';
import { Input } from 'src/components/Input';
import Label from 'src/components/Label';
import { usePluginContext } from 'src/components/DynamicPlugins';
import Icons from 'src/components/Icons';
import { nativeFilterGate } from 'src/dashboard/components/nativeFilters/utils';
import scrollIntoView from 'scroll-into-view-if-needed';

interface VizTypeGalleryProps {
  onChange: (vizType: string | null) => void;
  onDoubleClick: () => void;
  selectedViz: string | null;
  className?: string;
  denyList: string[];
}

type VizEntry = {
  key: string;
  value: ChartMetadata;
};

enum Sections {
  AllCharts = 'ALL_CHARTS',
  Featured = 'FEATURED',
  Category = 'CATEGORY',
  Tags = 'TAGS',
}

export const MAX_ADVISABLE_VIZ_GALLERY_WIDTH = 1090;

const OTHER_CATEGORY = t('Other');

const ALL_CHARTS = t('All widgets');

const FEATURED = t('Featured');

const CHATBOT = t('Chatbot');

const RECOMMENDED_TAGS = [FEATURED, t('ECharts'), t('Advanced-Analytics')];

export const VIZ_TYPE_CONTROL_TEST_ID = 'viz-type-control';

const VizPickerLayout = styled.div<{ isSelectedVizMetadata: boolean }>`
  ${({ isSelectedVizMetadata }) => `
    display: grid;
    height: 70vh;
    overflow: auto;
    background-color: white;
    
    ${isSelectedVizMetadata
      ? `
      grid-template-rows: auto minmax(100px, 1fr) minmax(200px, 35%);
      grid-template-columns: minmax(14em, auto) 5fr 2fr;
      grid-template-areas:
        "sidebar search details"
        "sidebar main details"
        "sidebar main details";
    `
      : `
      grid-template-rows: auto minmax(100px, 1fr);
      grid-template-columns: minmax(14em, auto) 1fr;
      grid-template-areas:
        "sidebar search"
        "sidebar main";
    `
    }
  `}
`;

const SectionTitle = styled.h3`
  margin-top: 10px;
  font-size: ${({ theme }) => theme.typography.sizes.l}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  line-height: ${({ theme }) => theme.gridUnit * 6}px;
`;

const LeftPane = styled.div`
  grid-area: sidebar;
  display: flex;
  flex-direction: column;
  border-right: 1px solid ${({ theme }) => theme.colors.grayscale.light2};
  overflow: auto;

  .ant-collapse .ant-collapse-item {
    .ant-collapse-header {
      font-size: ${({ theme }) => theme.typography.sizes.s}px;
      color: ${({ theme }) => theme.colors.grayscale.base};
      padding-left: ${({ theme }) => theme.gridUnit * 2}px;
      padding-bottom: ${({ theme }) => theme.gridUnit}px;
    }
    .ant-collapse-content .ant-collapse-content-box {
      display: flex;
      flex-direction: column;
      padding: 0 ${({ theme }) => theme.gridUnit * 2}px;
    }
  }
`;

const RightPane = styled.div`
  grid-area: main;
  overflow-y: auto;
`;

const SearchWrapper = styled.div`
  ${({ theme }) => `
    grid-area: search;
    width: 300px;
   
    margin-top: ${theme.gridUnit * 3}px;
    margin-bottom: ${theme.gridUnit}px;
    margin-left: ${theme.gridUnit * 3}px;
    margin-right: ${theme.gridUnit * 3}px;
    .antd5-input-affix-wrapper {
      padding-left: ${theme.gridUnit * 2}px;
    }
  `}
`;

/** Styles to line up prefix/suffix icons in the search input */
const InputIconAlignment = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  color: ${({ theme }) => theme.colors.grayscale.base};
`;

const SelectorLabel = styled.button`
  ${({ theme }) => `
    all: unset; // remove default button styles
    display: flex;
    flex-direction: row;
    align-items: center;
    cursor: pointer;
    margin: ${theme.gridUnit}px 0;
    padding: 0 ${theme.gridUnit}px;
    border-radius: ${theme.borderRadius}px;
    line-height: 2em;
    text-overflow: ellipsis;
    white-space: nowrap;
    position: relative;

    &:focus {
      outline: initial;
    }

    &.selected {
      background-color: ${theme.colors.primary.base};
      color: ${theme.colors.primary.light5};

      svg {
        color: ${theme.colors.primary.light5};
      }

      &:hover {
        .cancel {
          visibility: visible;
        }
      }
    }

    & > span[role="img"] {
      margin-right: ${theme.gridUnit * 2}px;
    }

    .cancel {
      visibility: hidden;
    }
  `}
`;

const IconsPane = styled.div`
  display: flex;
  justify-items: center;
  flex-wrap: wrap;
  gap: 6px;
  // for some reason this padding doesn't seem to apply at the bottom of the container. Why is a mystery.
  padding: ${({ theme }) => theme.gridUnit * 2}px;
`;

const DetailsPane = (theme: SupersetTheme) => css`
  grid-area: details;
`;

const DetailsPopulated = (theme: SupersetTheme) => css`
  gap: ${theme.gridUnit * 3}px;
  padding: ${theme.gridUnit * 4}px;
  border-left: 1px solid ${theme.colors.grayscale.light2};
`;

// overflow hidden on the details pane and overflow auto on the description
// (plus grid layout) enables the description to scroll while the header stays in place.
const TagsWrapper = styled.div`
  grid-area: viz-tags;
  width: ${({ theme }) => theme.gridUnit * 120}px;
  padding-bottom: ${({ theme }) => theme.gridUnit * 2}px;
`;

const Description = styled.p`
  grid-area: description;
  overflow: auto;
  margin: 0;
`;

const Examples = styled.div`
  grid-area: description;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  overflow: auto;
  gap: ${({ theme }) => theme.gridUnit * 4}px;

  justify-content: flex-start; // Ensures items start from the left
  align-items: center; // Centers items vertically
`;

const ExampleImageContainer = styled.div`
  display: flex;
  flex-direction: column; // Changed to column to center image
  justify-content: center;
  align-items: center;
  width: 200px; // Fixed width instead of max-width
  height: 200px; // Fixed height
  border: 1px solid ${({ theme }) => theme.colors.grayscale.light2};
  border-radius: ${({ theme }) => theme.gridUnit}px;
  margin: ${({ theme }) => theme.gridUnit}px; // Add margin for spacing
`;

const ExampleImage = styled.img`
  object-fit: contain;
  max-width: 180px; // Slightly less than container width
  max-height: 180px; // Slightly less than container height
`;

const thumbnailContainerCss = (theme: SupersetTheme) => css`
  cursor: pointer;
  border: 1px solid ${theme.colors.grayscale.light1};
  position: relative;
  border-radius: ${theme.gridUnit * 3}px;
  max-width: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 260px; // Fixed height to ensure consistent layout
  margin-left: 5px;

  img {
    flex: 0 0 240px; // Fixed height for image container
    max-width: 220px;
    max-height: 220px;
    object-fit: contain;

    transition: border-color ${theme.transitionTiming};
    border-bottom: 1px solid ${theme.colors.grayscale.light1};
    padding: 0 30px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &.selected {
    border: 2px solid ${theme.colors.primary.light2};
  }

  &:hover:not(.selected) {
    border: 2px solid ${theme.colors.grayscale.light1};
  }

  .viztype-label {
    margin-top: ${theme.gridUnit * 2}px;
    padding-left: 8px;
  }
`;

const HighlightLabel = styled.div`
  ${({ theme }) => `
    border: 1px solid ${theme.colors.primary.dark1};
    box-sizing: border-box;
    border-radius: ${theme.gridUnit}px;
    background: ${theme.colors.grayscale.light5};
    line-height: ${theme.gridUnit * 2.5}px;
    color: ${theme.colors.primary.dark1};
    font-size: ${theme.typography.sizes.s}px;
    font-weight: ${theme.typography.weights.bold};
    text-align: center;
    padding: ${theme.gridUnit * 0.5}px ${theme.gridUnit}px;
    cursor: pointer;

    div {
      transform: scale(0.83,0.83);
    }
  `}
`;

const ThumbnailLabelWrapper = styled.div`
  position: absolute;
  right: ${({ theme }) => theme.gridUnit}px;
  top: ${({ theme }) => theme.gridUnit * 19}px;
`;

const TitleLabelWrapper = styled.div`
  display: inline-block !important;
  margin-left: ${({ theme }) => theme.gridUnit * 2}px;
`;

interface ThumbnailProps {
  entry: VizEntry;
  selectedViz: string | null;
  setSelectedViz: (viz: string) => void;
  onDoubleClick: () => void;
}

const Thumbnail: FC<ThumbnailProps> = ({
  entry,
  selectedViz,
  setSelectedViz,
  onDoubleClick,
}) => {
  const theme = useTheme();
  const { key, value: type } = entry;
  const isSelected = selectedViz === entry.key;

  return (
    <div
      role="button"
      // using css instead of a styled component to preserve
      // the data-test attribute
      css={thumbnailContainerCss(theme)}
      tabIndex={0}
      className={isSelected ? 'selected' : ''}
      onClick={() => setSelectedViz(key)}
      onDoubleClick={onDoubleClick}
      data-test="viztype-selector-container"
    >
      <img
        alt={type.name}
        width="100%"
        className={`viztype-selector ${isSelected ? 'selected' : ''}`}
        src={type.thumbnail}
      />
      <div
        className="viztype-label"
        data-test={`${VIZ_TYPE_CONTROL_TEST_ID}__viztype-label`}
      >
        {type.name}
      </div>
      {type.label && (
        <ThumbnailLabelWrapper>
          <HighlightLabel>
            <div>{t(type.label)}</div>
          </HighlightLabel>
        </ThumbnailLabelWrapper>
      )}
    </div>
  );
};

interface ThumbnailGalleryProps {
  vizEntries: VizEntry[];
  selectedViz: string | null;
  setSelectedViz: (viz: string) => void;
  onDoubleClick: () => void;
}

/** A list of viz thumbnails, used within the viz picker modal */
const ThumbnailGallery: FC<ThumbnailGalleryProps> = ({
  vizEntries,
  ...props
}) => (
  <IconsPane data-test={`${VIZ_TYPE_CONTROL_TEST_ID}__viz-row`}>
    {vizEntries.map(entry => (
      <Thumbnail key={entry.key} {...props} entry={entry} />
    ))}
  </IconsPane>
);

const Selector: FC<{
  selector: string;
  sectionId: string;
  icon: ReactElement;
  isSelected: boolean;
  onClick: (selector: string, sectionId: string) => void;
  className?: string;
}> = ({ selector, sectionId, icon, isSelected, onClick, className }) => {
  const btnRef = useRef<HTMLButtonElement>(null);

  // see Element.scrollIntoViewIfNeeded()
  // see: https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoViewIfNeeded
  useEffect(() => {
    if (isSelected) {
      // We need to wait for the modal to open and then scroll, so we put it in the microtask queue
      queueMicrotask(() =>
        scrollIntoView(btnRef.current as HTMLButtonElement, {
          behavior: 'smooth',
          scrollMode: 'if-needed',
        }),
      );
    }
  }, []);

  return (
    <SelectorLabel
      ref={btnRef}
      key={selector}
      name={selector}
      className={cx(className, isSelected && 'selected')}
      onClick={() => onClick(selector, sectionId)}
    >
      {icon}
      {selector}
    </SelectorLabel>
  );
};

const doesVizMatchSelector = (viz: ChartMetadata, selector: string) =>
  selector === viz.category ||
  (selector === OTHER_CATEGORY && viz.category == null) ||
  (viz.tags || []).indexOf(selector) > -1;

export default function VizTypeGallery(props: VizTypeGalleryProps) {
  const { selectedViz, onChange, onDoubleClick, className, denyList } = props;
  const { mountedPluginMetadata } = usePluginContext();
  const searchInputRef = useRef<HTMLInputElement>();
  const [searchInputValue, setSearchInputValue] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(true);
  const isActivelySearching = isSearchFocused && !!searchInputValue;

  const selectedVizMetadata: ChartMetadata | null = selectedViz
    ? mountedPluginMetadata[selectedViz]
    : null;

  const chartMetadata: VizEntry[] = useMemo(() => {
    const result = Object.entries(mountedPluginMetadata)
      .map(([key, value]) => ({ key, value }))
      .filter(({ key }) => !denyList.includes(key))
      .filter(
        ({ value }) =>
          nativeFilterGate(value.behaviors || []) && !value.deprecated,
      )
      .sort((a, b) => a.value.name.localeCompare(b.value.name));
    return result;
  }, [mountedPluginMetadata, denyList]);

  const chartsByCategory = useMemo(() => {
    const result: Record<string, VizEntry[]> = {};
    chartMetadata.forEach(entry => {
      const category = entry.value.category || OTHER_CATEGORY;
      if (!result[category]) {
        result[category] = [];
      }
      result[category].push(entry);
    });
    return result;
  }, [chartMetadata]);

  const categories = useMemo(
    () =>
      Object.keys(chartsByCategory).sort((a, b) => {
        // make sure Other goes at the end
        if (a === OTHER_CATEGORY) return 1;
        if (b === OTHER_CATEGORY) return -1;
        // sort alphabetically
        return a.localeCompare(b);
      }),
    [chartsByCategory],
  );

  const chartsByTags = useMemo(() => {
    const result: Record<string, VizEntry[]> = {};
    chartMetadata.forEach(entry => {
      const tags = entry.value.tags || [];
      tags.forEach(tag => {
        if (!result[tag]) {
          result[tag] = [];
        }
        result[tag].push(entry);
      });
    });
    return result;
  }, [chartMetadata]);

  const tags = useMemo(
    () =>
      Object.keys(chartsByTags)
        .sort((a, b) =>
          // sort alphabetically
          a.localeCompare(b),
        )
        .filter(tag => RECOMMENDED_TAGS.indexOf(tag) === -1),
    [chartsByTags],
  );

  const sortedMetadata = useMemo(
    () =>
      chartMetadata.sort((a, b) => a.value.name.localeCompare(b.value.name)),
    [chartMetadata],
  );

  const [activeSelector, setActiveSelector] = useState<string>(
    () => selectedVizMetadata?.category || FEATURED,
  );

  const [activeSection, setActiveSection] = useState<string>(() =>
    selectedVizMetadata?.category ? Sections.Category : Sections.Featured,
  );

  // get a fuse instance for fuzzy search
  const fuse = useMemo(
    () =>
      new Fuse(chartMetadata, {
        ignoreLocation: true,
        threshold: 0.3,
        keys: [
          {
            name: 'value.name',
            weight: 4,
          },
          {
            name: 'value.tags',
            weight: 2,
          },
          'value.description',
        ],
      }),
    [chartMetadata],
  );

  const searchResults = useMemo(() => {
    if (searchInputValue.trim() === '') {
      return [];
    }
    return fuse
      .search(searchInputValue)
      .map(result => result.item)
      .sort((a, b) => {
        const aLabel = a.value?.label;
        const bLabel = b.value?.label;
        const aOrder =
          aLabel && chartLabelWeight[aLabel]
            ? chartLabelWeight[aLabel].weight
            : 0;
        const bOrder =
          bLabel && chartLabelWeight[bLabel]
            ? chartLabelWeight[bLabel].weight
            : 0;
        return bOrder - aOrder;
      });
  }, [searchInputValue, fuse]);

  const focusSearch = useCallback(() => {
    // "start searching" is actually a two-stage process.
    // When you first click on the search bar, the input is focused and nothing else happens.
    // Once you begin typing, the selected category is cleared and the displayed viz entries change.
    setIsSearchFocused(true);
  }, []);

  const changeSearch: ChangeEventHandler<HTMLInputElement> = useCallback(
    event => setSearchInputValue(event.target.value),
    [],
  );

  const stopSearching = useCallback(() => {
    // stopping a search takes you back to the category you were looking at before.
    // Unlike focusSearch, this is a simple one-step process.
    setIsSearchFocused(false);
    setSearchInputValue('');
    searchInputRef.current!.blur();
  }, []);

  const clickSelector = useCallback(
    (selector: string, sectionId: string) => {
      if (isSearchFocused) {
        stopSearching();
      }
      setActiveSelector(selector);
      setActiveSection(sectionId);
      // clear the selected viz if it is not present in the new category or tags
      const isSelectedVizCompatible =
        selectedVizMetadata &&
        doesVizMatchSelector(selectedVizMetadata, selector);
      if (selector !== activeSelector && !isSelectedVizCompatible) {
        onChange(null);
      }
    },
    [
      stopSearching,
      isSearchFocused,
      activeSelector,
      selectedVizMetadata,
      onChange,
    ],
  );

  const sectionMap = useMemo(
    () => ({
      [Sections.Category]: {
        title: t('Category'),
        icon: <Icons.Category iconSize="m" />,
        selectors: categories,
      },
      [Sections.Tags]: {
        title: t('Tags'),
        icon: <Icons.Tags iconSize="m" />,
        selectors: tags,
      },
    }),
    [categories, tags],
  );

  const getVizEntriesToDisplay = () => {
    if (isActivelySearching) {
      return searchResults;
    }
    if (activeSelector === ALL_CHARTS && activeSection === Sections.AllCharts) {
      return sortedMetadata;
    }
    if (
      activeSelector === CHATBOT &&
      activeSection === Sections.Featured &&
      mountedPluginMetadata['chatbot']
    ) {
      return [{ key: 'chatbot', value: mountedPluginMetadata['chatbot'] }];
    }
    if (
      activeSelector === FEATURED &&
      activeSection === Sections.Featured &&
      chartsByTags[FEATURED]
    ) {
      return chartsByTags[FEATURED];
    }
    if (
      activeSection === Sections.Category &&
      chartsByCategory[activeSelector]
    ) {
      return chartsByCategory[activeSelector];
    }
    if (activeSection === Sections.Tags && chartsByTags[activeSelector]) {
      return chartsByTags[activeSelector];
    }
    return [];
  };

  return (
    <VizPickerLayout
      className={className}
      isSelectedVizMetadata={Boolean(selectedVizMetadata)}
    >
      <LeftPane>
        <Selector
          css={({ gridUnit }) =>
            // adjust style for not being inside a collapse
            css`
              margin: ${gridUnit * 2}px;
              margin-bottom: 0;
            `
          }
          sectionId={Sections.AllCharts}
          selector={ALL_CHARTS}
          icon={<Icons.Ballot iconSize="m" />}
          isSelected={
            !isActivelySearching &&
            ALL_CHARTS === activeSelector &&
            Sections.AllCharts === activeSection
          }
          onClick={clickSelector}
        />
        <Selector
          css={({ gridUnit }) =>
            // adjust style for not being inside a collapse
            css`
              margin: ${gridUnit * 2}px;
              margin-bottom: 0;
            `
          }
          sectionId={Sections.Featured}
          selector={FEATURED}
          icon={<Icons.FireOutlined iconSize="xl" />}
          isSelected={
            !isActivelySearching &&
            FEATURED === activeSelector &&
            Sections.Featured === activeSection
          }
          onClick={clickSelector}
        />
        <Selector
          css={({ gridUnit }) =>
            // adjust style for not being inside a collapse
            css`
              margin: ${gridUnit * 2}px;
              margin-bottom: 0;
            `
          }
          sectionId={Sections.Featured}
          selector={CHATBOT}
          icon={<Icons.FireOutlined iconSize="xl" />}
          isSelected={
            !isActivelySearching &&
            CHATBOT === activeSelector &&
            Sections.Featured === activeSection
          }
          onClick={clickSelector}
        />

        <AntdCollapse
          expandIconPosition="right"
          ghost
          defaultActiveKey={Sections.Category}
        >
          {Object.keys(sectionMap).map(sectionId => {
            const section = sectionMap[sectionId as keyof typeof sectionMap];

            return (
              <AntdCollapse.Panel
                header={<span className="header">{section.title}</span>}
                key={sectionId}
              >
                {section.selectors.map((selector: string) => (
                  <Selector
                    key={selector}
                    selector={selector}
                    sectionId={sectionId}
                    icon={section.icon}
                    isSelected={
                      !isActivelySearching &&
                      selector === activeSelector &&
                      sectionId === activeSection
                    }
                    onClick={clickSelector}
                  />
                ))}
              </AntdCollapse.Panel>
            );
          })}
        </AntdCollapse>
      </LeftPane>

      <SearchWrapper>
        <Input
          style={{ borderRadius: '12px' }}
          type="text"
          ref={searchInputRef as any /* cast required because emotion */}
          value={searchInputValue}
          placeholder={t('Search all widgets')}
          onChange={changeSearch}
          onFocus={focusSearch}
          data-test={`${VIZ_TYPE_CONTROL_TEST_ID}__search-input`}
          prefix={
            <InputIconAlignment>
              <Icons.Search iconSize="m" />
            </InputIconAlignment>
          }
          suffix={
            <InputIconAlignment>
              {searchInputValue && (
                <Icons.XLarge iconSize="m" onClick={stopSearching} />
              )}
            </InputIconAlignment>
          }
        />
      </SearchWrapper>

      <RightPane>
        <ThumbnailGallery
          vizEntries={getVizEntriesToDisplay()}
          selectedViz={selectedViz}
          setSelectedViz={onChange}
          onDoubleClick={onDoubleClick}
        />
      </RightPane>

      {selectedVizMetadata ? (
        <div
          css={(theme: SupersetTheme) => [
            DetailsPane(theme),
            DetailsPopulated(theme),
          ]}
        >
          <>
            <SectionTitle
              css={css`
                grid-area: viz-name;
                position: relative;
              `}
            >
              {selectedVizMetadata?.name}
              {selectedVizMetadata?.label && (
                <Tooltip
                  id="viz-badge-tooltip"
                  placement="top"
                  title={
                    selectedVizMetadata.labelExplanation ??
                    chartLabelExplanations[selectedVizMetadata.label]
                  }
                >
                  <TitleLabelWrapper>
                    <HighlightLabel>
                      <div>{t(selectedVizMetadata.label)}</div>
                    </HighlightLabel>
                  </TitleLabelWrapper>
                </Tooltip>
              )}
            </SectionTitle>
            <TagsWrapper>
              {selectedVizMetadata?.tags.map(tag => (
                <Label key={tag} style={{ marginBottom: '6px' }}>
                  {tag}
                </Label>
              ))}
            </TagsWrapper>
            <Description>
              {selectedVizMetadata?.description ||
                t('No description available.')}
            </Description>
            <SectionTitle
              css={css`
                grid-area: examples-header;
              `}
            >
              {t('Examples')}
            </SectionTitle>
            <Examples>
              {(selectedVizMetadata?.exampleGallery?.length
                ? selectedVizMetadata.exampleGallery
                : [
                  {
                    url: selectedVizMetadata?.thumbnail,
                    caption: selectedVizMetadata?.name,
                  },
                ]
              ).map(example => (
                <ExampleImageContainer key={example.url}>
                  <ExampleImage
                    key={example.url}
                    src={example.url}
                    alt={example.caption}
                    title={example.caption}
                  />
                </ExampleImageContainer>
              ))}
            </Examples>
          </>
        </div>
      ) : null}
    </VizPickerLayout>
  );
}
