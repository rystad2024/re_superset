import { styled, keyframes } from '@superset-ui/core';
import React, { useEffect, useRef, useState } from 'react';
import Icons from 'src/components/Icons';
import { useFetchAllData, useGetFavoriteStatus } from 'src/views/CRUD/hooks';
import FavouriteComponent from './FavouriteComponent';
import { Link } from 'react-router-dom';

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
  text-decoration: none;
  color: #333;
  transition:
    background 0.2s ease,
    color 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-radius: 3px;
  border-bottom: 1px solid #f0f0f0;
  &:hover {
    background: #eef4ff;
    color: #0073e6;
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

interface ResultItem {
  id: string | number;
  url?: string;
  explore_url?: string;
  dashboard_title?: string;
  slice_name?: string;
  table_name?: string;
}

interface ResourceValue {
  result?: ResultItem[];
}

interface ResourceMapping {
  title: string;
  icon: JSX.Element;
  link: string;
  getItemTitle: (item: ResultItem) => string | undefined;
}

function SearchBar() {
  const [isSearchBoxClicked, setIsSearchBoxClicked] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLDivElement | null>(null);
  const { allData, filteredData, setFilteredData, loading, refetch } =
    useFetchAllData();

  const { favoriteStatus, favIds, filteredFavData } =
    useGetFavoriteStatus(allData);

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
      getItemTitle: (item: ResultItem) => item.dashboard_title,
    },
    chart: {
      title: 'Widgets',
      icon: <Icons.NavCharts iconSize="l" style={{ paddingRight: '2px' }} />,
      link: '/chart/list',
      getItemTitle: (item: ResultItem) => item.slice_name,
    },
    explore: {
      title: 'Explore Data',
      icon: <Icons.Database iconSize="l" style={{ paddingRight: '2px' }} />,
      link: '/exploredata/list/',
      getItemTitle: (item: ResultItem) => item.table_name,
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
                          >
                            View all
                          </Link>
                        </DropdownHeader>
                        {results.map((item: ResultItem) => (
                          <DropdownItem
                            key={`${resourceKey}-${item.id}`}
                            href={item?.url || item?.explore_url}
                            rel="noopener noreferrer"
                          >
                            {config.icon}
                            {config.getItemTitle(item)}
                          </DropdownItem>
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

export default SearchBar;
