import { styled, keyframes } from '@superset-ui/core';
import React, { useEffect, useRef, useState } from 'react';
import Icons from 'src/components/Icons';
import { useFetchAllData, useGetFavoriteStatus } from 'src/views/CRUD/hooks';
import FavouriteComponent from './FavouriteComponent';

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
  width: 280px;
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
  max-height: 200px;
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
  padding: 4px 10px;
  font-size: 11px;
  font-weight: bold;
  color: #444;
  background: #f0f0f0;
  border-bottom: 1px solid #ddd;
`;

const DropdownItem = styled.a`
  display: flex;
  align-items: center;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 11px;
  text-decoration: none;
  color: #333;
  transition:
    background 0.2s ease,
    color 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-radius: 3px;

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
                    return results.length > 0 ? (
                      <div key={resourceKey}>
                        <DropdownHeader>
                          {resourceKey === 'dashboard'
                            ? 'Workspaces'
                            : resourceKey === 'chart'
                              ? 'Widgets'
                              : 'Explore Data'}
                        </DropdownHeader>
                        {results.map((item: any) => (
                          <DropdownItem
                            key={`${resourceKey}-${item.id}`}
                            href={item?.url || item?.explore_url}
                            rel="noopener noreferrer"
                          >
                            {resourceKey === 'dashboard' ? (
                              <Icons.NavDashboard
                                iconSize="l"
                                style={{ paddingRight: '2px' }}
                              />
                            ) : resourceKey === 'chart' ? (
                              <Icons.NavCharts
                                iconSize="l"
                                style={{ paddingRight: '2px' }}
                              />
                            ) : (
                              <Icons.Database
                                iconSize="l"
                                style={{ paddingRight: '2px' }}
                              />
                            )}

                            {item.dashboard_title ||
                              item.slice_name ||
                              item.table_name}
                          </DropdownItem>
                        ))}
                      </div>
                    ) : null;
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
