import { styled } from "@superset-ui/core";
import React from "react";
import { ChartResult, DashboardResult, FavoriteResources, FilteredFavouiteData } from "src/views/CRUD/types";

const shimmerAnimation = `
  @keyframes shimmer {
    0% { background-position: -200px 0; }
    100% { background-position: 200px 0; }
  }
`;

const FavouriteContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 6px;
  padding: 10px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #ddd;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  margin:2px 2px 4px 2px;
`;

const FavouriteHeader = styled.div`
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #444;
`;

const FavouriteItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 4px;
  border-radius: 4px;
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  font-size: 10px;
  font-weight: 500;
  width: 100%;
  text-align: start;
  min-height: 24px;
  overflow: hidden;
`;

const FavouriteLink = styled.a`
  display: block;
  max-width: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: inherit;
  text-decoration: none;
`;

const StarIcon = styled.span`
  color: gold;
  font-size: 12px;
`;

const ShimmerItem = styled.div`
  width: 100%;
  height: 14px;
  border-radius: 4px;
  background: linear-gradient(90deg, #e0e0e0 25%, #f8f8f8 50%, #e0e0e0 75%);
  background-size: 400% 100%;
  animation: shimmer 1.2s infinite;
  ${shimmerAnimation}
`;

interface FavouriteComponentProps {
  filteredFavData: FilteredFavouiteData[];
  favoriteStatus: FavoriteResources;
  favIds: number[];
}

function isDashboard(item: FilteredFavouiteData): item is DashboardResult {
  return "dashboard_title" in item && !("slice_name" in item);
}

function isChart(item: FilteredFavouiteData): item is ChartResult {
  return "viz_type" in item && "slice_name" in item;
}

const FavouriteComponent: React.FC<FavouriteComponentProps> = ({ filteredFavData, favoriteStatus, favIds }) => {

  return (
    <div>
      <FavouriteHeader>Favourite Items</FavouriteHeader>
      <FavouriteContainer>
        {filteredFavData.length === 0 ? (
          Array.from({ length: 5 }).map((_, index) => <ShimmerItem key={index} />)
        ) : (
          filteredFavData.map((item) => (
            <FavouriteItem key={item.id}>
              <StarIcon>&#9733;</StarIcon>
              {isDashboard(item) ? (
                <FavouriteLink href={item.url} title={item.dashboard_title}>{item.dashboard_title}</FavouriteLink>
              ) : isChart(item) ? (
                <FavouriteLink href={item.url} title={item.slice_name}>{item.slice_name} (Type: {item.viz_type})</FavouriteLink>
              ) : (
                <span>Unknown Item</span>
              )}
            </FavouriteItem>
          ))
        )}
      </FavouriteContainer>
    </div>
  );
};

export default FavouriteComponent;