import { styled, keyframes, t } from '@superset-ui/core';
import React, { useEffect, useRef, useState } from 'react';
import Icons from 'src/components/Icons';
import { useFetchAllData, useGetFavoriteStatus } from 'src/views/CRUD/hooks';
import FavouriteComponent from './FavouriteComponent';
import { Link } from 'react-router-dom';
import { APIResponseStructure } from 'src/views/CRUD/types';

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
`;

const SkeletonItem = styled.div`
  width: 80%;
  height: 12px;
  margin: 6px auto;
  border-radius: 4px;
  background: linear-gradient(90deg, #e0e0e0 25%, #f8f8f8 50%, #e0e0e0 75%);
  background-size: 300% 100%;
  animation: ${shimmer} 1s infinite;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  border-radius: 6px;
  padding: 0 10px;
  height: 36px;
  transition: all 0.2s ease;
  margin-right: 20px;
  background: #fff;
  border: 1px solid #ccc;
  width: 380px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  &:hover,
  &:focus-within {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    border-color: #aaa;
  }
`;

const SearchInput = styled.input`
  border: none;
  background: transparent;
  font-size: 14px;
  width: 100%;
  padding: 6px;
  outline: none;

  &::placeholder {
    color: #888;
  }
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  color: #555;
  margin-right: 6px;
`;

const DropdownContainer = styled.div`
  position: absolute;
  top: 38px;
  left: 0;
  width: 100%;
  max-height: 300px;
  overflow-y: auto;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0px 3px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #ddd;
  z-index: 9999;
  padding: 6px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #bbb;
    border-radius: 4px;
  }
`;

const DropdownHeader = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  padding: 4px 10px;
  font-size: 14px;
  font-weight: bold;
  color: #fff;
  background-color: ${({ theme }) => theme.colors.primary.dark1};
`;

const DropdownItem = styled.a`
  display: flex;
  align-items: center;
 
  padding: 6px 10px;
  gap: 6px;
  cursor: pointer;
  font-size: 14px;
 
  color: #333;
  link-style: none;
  transition: all 0.25s ease,
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-radius: 3px;
  border-bottom: 1px solid #f0f0f0;
  &:hover {
    background: #eef4ff;
    color: #0073e6;
     text-decoration: none;
  }

`;

const NoDataMessage = styled.div`
  padding: 8px;
  font-size: 11px;
  color: #777;
  text-align: center;
`;

const Resources = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 6px;
`;

type ResultItem =
  | APIResponseStructure['dashboard']['result'][0]
  | APIResponseStructure['chart']['result'][0]
  | APIResponseStructure['dataset']['result'][0];

interface ResourceMapping {
  title: string;
  icon: JSX.Element;
  link: string;
  getItemTitle: (item: ResultItem) => string | undefined;
  fallbackUrl?: string;
}

function SearchBar() {
  const [isSearchBoxClicked, setIsSearchBoxClicked] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLDivElement | null>(null);
  const { allData, filteredData, setFilteredData, loading, refetch } =
    useFetchAllData();

  const { favoriteStatus, favIds, filteredFavData } = useGetFavoriteStatus(
    allData,
    isSearchBoxClicked,
  );

  function handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);

    const newFilteredData = Object.entries(allData).reduce(
      (acc: any, [resourceKey, resourceValue]) => {
        const results = resourceValue.result.filter((item: any) =>
          (item.dashboard_title || item.slice_name || item.table_name)
            ?.toLowerCase()
            .includes(query),
        );

        if (results.length > 0) {
          acc[resourceKey] = { result: results };
        }
        return acc;
      },
      {},
    );

    setFilteredData(newFilteredData);
  }

  function handleSearchClick() {
    refetch();
    setIsSearchBoxClicked(true);
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchBoxClicked(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const resourceMappings: Record<string, ResourceMapping> = {
    dashboard: {
      title: 'Workspaces',
      icon: <Icons.NavDashboard iconSize="l" style={{ paddingRight: '2px' }} />,
      link: '/workspaces/list/',
      getItemTitle: (item: ResultItem) =>
        'dashboard_title' in item ? item.dashboard_title : undefined,
      fallbackUrl: '/static/assets/images/dashboard-fallback.svg',
    },
    chart: {
      title: 'Widgets',
      icon: <Icons.NavCharts iconSize="l" style={{ paddingRight: '2px' }} />,
      link: '/chart/list',
      getItemTitle: (item: ResultItem) =>
        'slice_name' in item ? item.slice_name : undefined,
      fallbackUrl: '/static/assets/images/chart-fallback.svg',
    },
    explore: {
      title: 'Explore Data',
      icon: <Icons.Database iconSize="l" style={{ paddingRight: '2px' }} />,
      link: '/exploredata/list/',
      getItemTitle: (item: ResultItem) =>
        'table_name' in item ? item.table_name : undefined,
    },
  };

  return (
    <SearchContainer ref={searchRef}>
      <IconWrapper>
        <Icons.Search />
      </IconWrapper>
      <SearchInput
        placeholder="Search"
        onChange={handleSearchChange}
        onClick={handleSearchClick}
        value={searchQuery}
      />
      {isSearchBoxClicked &&
        (loading || Object.keys(filteredData).length > 0) && (
          <DropdownContainer onMouseDown={e => e.stopPropagation()}>
            <FavouriteComponent
              filteredFavData={filteredFavData}
              favoriteStatus={favoriteStatus}
              favIds={favIds}
            />
            <Resources>
              {loading ? (
                <>
                  <SkeletonItem />
                  <SkeletonItem />
                  <SkeletonItem />
                </>
              ) : Object.keys(filteredData).length === 0 ? (
                <NoDataMessage>No matching results found</NoDataMessage>
              ) : (
                Object.entries(filteredData).map(
                  ([resourceKey, resourceValue]) => {
                    const results = resourceValue.result || [];
                    if (results.length === 0) return null;

                    // Get the correct configuration for this resource
                    const config =
                      resourceMappings[resourceKey] || resourceMappings.explore;
                    return (
                      <div key={resourceKey}>
                        <DropdownHeader>
                          {config.title}
                          <Link
                            to={config.link}
                            style={{
                              color: 'white',
                              fontStyle: 'italic',
                              fontWeight: 'normal',
                            }}
                            onClick={() => setIsSearchBoxClicked(false)}
                          >
                            View all
                          </Link>
                        </DropdownHeader>
                        {results.map((item: ResultItem) => (
                          <EnhancedDropdownItem
                            key={`${resourceKey}-${item.id}`}
                            item={item}
                            resourceKey={resourceKey}
                            config={config}
                          />
                        ))}
                      </div>
                    );
                  },
                )
              )}
            </Resources>
          </DropdownContainer>
        )}
    </SearchContainer>
  );
}

const EnhancedDropdownItem: React.FC<{
  item: ResultItem;
  resourceKey: string;
  config: ResourceMapping;
}> = ({ item, resourceKey, config }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <DropdownItem
      href={
        'url' in item
          ? item.url
          : 'explore_url' in item
            ? item.explore_url
            : '#'
      }
      rel="noopener noreferrer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        {/* Always visible content */}
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          {config.icon}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {config.getItemTitle(item)}
          </span>
        </div>

        {/* Additional content that appears on hover */}
        {isHovered && (
          <div
            style={{
              overflow: 'hidden',
              display: 'flex',
              gap: '8px',
              marginTop: '8px',
              height: 'auto',
              width: '100%',
              justifyContent: 'space-between',
            }}
          >
            {config.fallbackUrl && (
              <div
                style={{
                  width: '80px',
                  height: '40px',
                  flexShrink: 0,
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={config.fallbackUrl}
                  alt="Preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </div>
            )}

            <div style={{ overflow: 'hidden', alignSelf: 'end' }}>
              <div
                style={{
                  fontSize: '10px',
                  color: '#666',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                <Icons.Clock style={{ fontSize: '14px' }} />

                <div>{t('Modified %s', item.changed_on_delta_humanized)}</div>
                {'changed_by_name' in item && item.changed_by_name && (
                  <div style={{ textDecoration: 'none' }}>
                    {' '}
                    by {item.changed_by_name}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DropdownItem>
  );
};

export default SearchBar;
