import { styled, keyframes } from "@superset-ui/core";
import React, { useEffect, useRef, useState } from "react";
import Icons from "src/components/Icons";
import { useFetchAllData, useGetFavoriteStatus } from "src/views/CRUD/hooks";

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
`;

const SkeletonItem = styled.div`
  max-width: 90%;
  height: 18px;
  margin: 10px auto; /* ✅ Centered skeleton with even spacing */
  border-radius: 6px;
  background: linear-gradient(90deg, #e0e0e0 25%, #f8f8f8 50%, #e0e0e0 75%);
  background-size: 400% 100%;
  animation: ${shimmer} 1.2s infinite;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  border-radius: 8px;
  padding: 0 14px;
  height: 45px;
  transition: all 0.3s ease;
  margin-right: 50px;
  background: #fff;
  border: 1px solid #d1d1d1;
  width: 420px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);

  &:hover,
  &:focus-within {
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.15);
    border-color: #bbb;
  }
`;

const SearchInput = styled.input`
  border: none;
  background: transparent;
  font-size: 16px;
  width: 100%;
  padding: 10px;
  outline: none;

  &::placeholder {
    color: #aaa;
  }
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  color: #666;
  margin-right: 10px;
`;

const DropdownContainer = styled.div`
  position: absolute;
  top: 50px;
  left: 0;
  width: 100%;
  max-height: 350px;
  overflow-y: auto;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.12);
  border: 1px solid #e0e0e0;
  z-index: 9999;
  padding: 8px 0;
  animation: fadeIn 0.2s ease-in-out;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #bbb;
    border-radius: 6px;
  }
`;

const DropdownHeader = styled.div`
  padding: 10px 16px;
  font-size: 14px;
  font-weight: bold;
  color: #444;
  background: #f6f6f6;
  border-bottom: 1px solid #e0e0e0;
`;

const DropdownItem = styled.a`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  font-size: 14px;
  text-decoration: none;
  color: #333;
  transition: background 0.2s ease, color 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-radius: 4px;

  &:hover {
    background: #eef4ff;
    color: #0073e6;
  }
`;

const NoDataMessage = styled.div`
  padding: 12px;
  font-size: 14px;
  color: #888;
  text-align: center;
`;


function SearchBar() {
    const [isSearchBoxClicked, setIsSearchBoxClicked] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const searchRef = useRef<HTMLDivElement | null>(null);
    const { allData, filteredData, setFilteredData, loading, refetch } = useFetchAllData();

    const { favoriteStatus,favIds,filteredFavData } = useGetFavoriteStatus(allData);

    useEffect(() => {
    console.log("Favorite Status: ", favoriteStatus);
    console.log("Favorite ids: ", favIds);
    console.log("FilteredFavData:", filteredFavData);
    }, [favoriteStatus]);

    function handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
        const query = event.target.value.toLowerCase();
        setSearchQuery(query);

        const newFilteredData = Object.entries(allData).reduce(
            (acc: any, [resourceKey, resourceValue]) => {
                const results = resourceValue.result.filter((item: any) =>
                    (item.dashboard_title || item.slice_name || item.table_name)
                        ?.toLowerCase()
                        .includes(query)
                );

                if (results.length > 0) {
                    acc[resourceKey] = { result: results };
                }
                return acc;
            },
            {}
        );

        setFilteredData(newFilteredData);
    }

    function handleSearchClick() {
        refetch();
        setIsSearchBoxClicked(true);
    }

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchBoxClicked(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
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
            {isSearchBoxClicked && (loading || Object.keys(filteredData).length > 0) && (
                <DropdownContainer onMouseDown={(e) => e.stopPropagation()}>
                    {loading ? (
                        <>
                            <SkeletonItem />
                            <SkeletonItem />
                            <SkeletonItem />
                        </>
                    ) : Object.keys(filteredData).length === 0 ? (
                        <NoDataMessage>No matching results found</NoDataMessage>
                    ) :

                        (
                            Object.entries(filteredData).map(([resourceKey, resourceValue]) => {
                                const results = resourceValue.result || [];
                                return results.length > 0 ? (
                                    <div key={resourceKey}>
                                        <DropdownHeader>{resourceKey.toUpperCase()}</DropdownHeader>
                                        {results.map((item: any) => (
                                            <DropdownItem key={`${resourceKey}-${item.id}`}>
                                                <a href={item?.url || item?.explore_url} rel="noopener noreferrer">
                                                    {item.dashboard_title || item.slice_name || item.table_name}
                                                </a>
                                            </DropdownItem>
                                        ))}
                                    </div>
                                ) : null;
                            })
                        )}
                </DropdownContainer>
            )}
        </SearchContainer>
    );
}

export default SearchBar;
