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
import { useState, useEffect, useRef } from 'react';
import { styled, SupersetClient } from '@superset-ui/core';
import { getUrlParam } from 'src/utils/urlUtils';
import { Grid } from 'src/components';
import { MainNav, MenuMode } from 'src/components/Menu';
import { Tooltip } from 'src/components/Tooltip';
import { NavLink, useLocation } from 'react-router-dom';
import { GenericLink } from 'src/components/GenericLink/GenericLink';
import Icons from 'src/components/Icons';
import { useUiConfig } from 'src/components/UiConfigContext';
import { URL_PARAMS } from 'src/constants';
import {
  MenuObjectChildProps,
  MenuObjectProps,
  MenuData,
} from 'src/types/bootstrapTypes';
import RightMenu from './RightMenu';
import rison from 'rison';
import { keyBy } from 'lodash';
import { resourceUsage } from 'process';
import { Item } from 'src/components/Pagination/Item';
import { Charts, Dashboard } from 'src/dashboard/types';
import Chart from 'src/types/Chart';
import Dataset from 'src/types/Dataset';
import SearchBar from './SearchBar';
import { useFetchAllData } from 'src/views/CRUD/hooks';

interface MenuProps {
  data: MenuData;
  isFrontendRoute?: (path?: string) => boolean;
}

const StyledHeader = styled.header`
  ${({ theme }) => `
      background-color: white;
      margin-bottom: 2px;
      z-index: 10;

      .main-nav, .navbar {
        background-color: white;
        font-size: 16px !important;
      }
      &:nth-last-of-type(2) nav {
        margin-bottom: 2px;
      }
      .caret {
        display: none;
      }
      .navbar-brand {
        display: flex;
        flex-direction: column;
        justify-content: center;
        /* must be exactly the height of the Antd navbar */
        min-height: 50px;
        padding: ${theme.gridUnit}px
          ${theme.gridUnit * 2}px
          ${theme.gridUnit}px
          ${theme.gridUnit * 4}px;
        // max-width: ${theme.gridUnit * theme.brandIconMaxWidth}px;
        img {
          height: 100%;
          object-fit: contain;
        }
        &:focus {
          border-color: transparent;
        }
        &:focus-visible {
          border-color: ${theme.colors.primary.dark1};
        }
      }
      .navbar-brand-text {
        border-left: 1px solid ${theme.colors.grayscale.light2};
        border-right: 1px solid ${theme.colors.grayscale.light2};
        height: 100%;
        color: ${theme.colors.grayscale.dark1};
        padding-left: ${theme.gridUnit * 4}px;
        padding-right: ${theme.gridUnit * 4}px;
        margin-right: ${theme.gridUnit * 6}px;
        font-size: ${theme.gridUnit * 4}px;
        float: left;
        display: flex;
        flex-direction: column;
        justify-content: center;

        span {
          max-width: ${theme.gridUnit * 58}px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        @media (max-width: 1127px) {
          display: none;
        }
      }
      @media (max-width: 767px) {
        .navbar-brand {
          float: none;
        }
      }
      @media (max-width: 767px) {
        .antd5-menu-item {
          height: 100%;
          padding: 0 ${theme.gridUnit * 6}px 0
            ${theme.gridUnit * 3}px !important;
        }
        .antd5-menu > .antd5-menu-item > span > a {
          padding: 0px;
          
        }
        .main-nav .antd5-menu-submenu-title > svg:nth-of-type(1) {
          display: none;
        }
      }
  `}
`;
const { SubMenu } = MainNav;

const StyledSubMenu = styled(SubMenu)`
  background-color: #e8edf3;
  height: 100%;
`;

const HeaderContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const TopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0;
  margin: 0;
  height: 55px;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
`;

const NavRightContainer = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto;
  flex-shrink: 0;
  white-space: nowrap;
  height: 55px;
`;

const SearchRowContainer = styled.div`
  display: none;
  width: 100%;

  @media (max-width: 992px) {
    display: block;

    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
`;

const SearchBarWrapper = styled.div`
  @media (max-width: 992px) {
    &.desktop-search {
      display: none;
    }
  }

  @media (min-width: 993px) {
    &.mobile-search {
      display: none;
    }
  }
`;

const { useBreakpoint } = Grid;

export function Menu({
  data: {
    menu,
    brand,
    navbar_right: navbarRight,
    settings,
    environment_tag: environmentTag,
  },
  isFrontendRoute = () => false,
}: MenuProps) {
  const [showMenu, _setMenu] = useState<MenuMode>('horizontal');
  const screens = useBreakpoint();
  const uiConfig = useUiConfig();

  // useEffect(() => {
  //   function handleResize() {
  //     if (window.innerWidth <= 767) {
  //       setMenu('inline');
  //     } else setMenu('horizontal');
  //   }
  //   handleResize();
  //   const windowResize = debounce(() => handleResize(), 10);
  //   window.addEventListener('resize', windowResize);
  //   return () => window.removeEventListener('resize', windowResize);
  // }, []);

  enum Paths {
    Explore = '/explore',
    Dashboard = '/workspace',
    Chart = '/chart',
    Datasets = '/exploredata',
  }

  const defaultTabSelection: string[] = [];
  const [activeTabs, setActiveTabs] = useState(defaultTabSelection);
  const { refetch } = useFetchAllData();
  // const [isSearchBoxClicked, setIsSearchBoxClicked] = useState(false);
  // const [allData, setAllData] = useState({});
  // const searchRef = useRef<HTMLDivElement | null>(null);

  const location = useLocation();
  useEffect(() => {
    const path = location.pathname;
    switch (true) {
      case path.startsWith(Paths.Dashboard):
        setActiveTabs(['Workspaces']);
        break;
      case path.startsWith(Paths.Datasets):
      case path.includes('/exploredata'):
        setActiveTabs(['Explore Data']);
        break;
      case path.startsWith(Paths.Chart) || path.startsWith(Paths.Explore):
        setActiveTabs(['Widgets']);
        break;

      default:
        setActiveTabs(defaultTabSelection);
    }
  }, [location.pathname]);

  

  const standalone = getUrlParam(URL_PARAMS.standalone);
  if (standalone || uiConfig.hideNav) return <></>;


  // const fetchAllData = async () => {
  //   const resources = ['dashboard', 'chart', 'dataset'];
  //   const promises = resources.map(async resource =>{
  //     const queryParams = rison.encode_uri({
  //       page: 0,
  //       page_size: 10000, // Large value to get all records
  //       order_column: 'changed_on_delta_humanized',
  //       order_direction: 'desc',
  //     });
      
  //     const response = await SupersetClient.get({
  //       endpoint: `/api/v1/${resource}/?q=${queryParams}`, 
  //     });
  //     return { [resource]: response.json };
  //   })
  
  //   const allDataArray = await Promise.all(promises);
  //   const allData = Object.assign({}, ...allDataArray);
  //   setAllData(allData);
  //   console.log(allData);
  // };

  // function handleSearchChange(event: React.ChangeEvent<HTMLInputElement>){
  //   console.log(event?.target.value)
  // }

  // function handleSearchClick(){
  //   fetchAllData();
  //   setIsSearchBoxClicked(true);
  // }

  // useEffect(() => {
  //   function handleClickOutside(event: MouseEvent) {
  //     if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
  //       setIsSearchBoxClicked(false);
  //     }
  //   }

  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, []);

  // const SearchBar = () => {
  
  //   const SearchContainer = styled.div`
  //   display: flex;
  //   align-items: center;
  //   position: relative;
  //   border-radius: 4px;
  //   padding: 0 12px;
  //   height: 40px; /* Slightly increased height for better UX */
  //   transition: all 0.2s ease;
  //   margin-right: 50px;
  //   background: #fff;
  //   border: 1px solid #ccc;
  //   width: 350px; /* Increased width */
  
  //   &:hover,
  //   &:focus-within {
  //     box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  //   }
  // `;
  
  // const SearchInput = styled.input`
  //   border: none;
  //   background: transparent;
  //   font-size: 16px;
  //   width: 100%;
  //   padding: 10px 12px;
  //   outline: none;
  
  //   &::placeholder {
  //     color: #666;
  //   }
  // `;
  
  // const IconWrapper = styled.div`
  //   display: flex;
  //   align-items: center;
  //   color: #666;
  //   margin-right: 8px;
  // `;
  
  // const DropdownContainer = styled.div`
  //   position: absolute;
  //   top: 200px;
  //   left: 0;
  //   width: 350px; /* Match width with SearchContainer */
  //   max-height: 400px; /* Increased height */
  //   overflow-y: auto;
  //   background: #fff;
  //   border: 1px solid #ccc;
  //   border-radius: 4px;
  //   box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  //   z-index: 9999;
  // `;
  
  // const DropdownItem = styled.div`
  //   padding: 12px; /* Increased padding for better readability */
  //   cursor: pointer;
  //   transition: background 0.2s ease-in-out;
  //   font-size: 14px; /* Slightly larger text */
    
  //   &:hover {
  //     background: #f5f5f5;
  //   }
  // `;
  
  //   return (
  //     <SearchContainer ref={searchRef}>
  //     <IconWrapper>
  //       <Icons.Search />
  //     </IconWrapper>
  //     <SearchInput
  //       placeholder="Search"
  //       onChange={(e) => handleSearchChange(e)}
  //       onClick={handleSearchClick}
  //     />
  //     {isSearchBoxClicked && (
  //       <DropdownContainer onMouseDown={(e) => e.stopPropagation()}>
  //         {Object.entries(allData).map(([resourceKey, resourceValue]: [string, { result: any[] }]) => {
  //           const results = resourceValue.result || [];
  //           return (
  //             <div key={resourceKey}>
  //               <strong>{resourceKey.toUpperCase()}</strong>
  //               {results.length === 0 ? (
  //                 <DropdownItem>No Data</DropdownItem>
  //               ) : (
  //                 results.map((item) => (
  //                   <DropdownItem key={`${resourceKey}-${item.id}`}>
  //                     {item.dashboard_title || item.slice_name || item.table_name}
  //                   </DropdownItem>
  //                 ))
  //               )}
  //             </div>
  //           );
  //         })}
  //       </DropdownContainer>
  //     )}
  //   </SearchContainer>
  //   );
  // };

  const renderSubMenu = ({
    label,
    childs,
    url,
    index,
    isFrontendRoute,
  }: MenuObjectProps) => {
    if (url && isFrontendRoute) {
      return (
        <MainNav.Item key={label} role="presentation">
          <NavLink role="button" to={url} activeClassName="is-active">
            {label}
          </NavLink>
        </MainNav.Item>
      );
    }
    if (url) {
      return (
        <MainNav.Item key={label}>
          <a href={url}>{label}</a>
        </MainNav.Item>
      );
    }
    return (
      <StyledSubMenu
        key={index}
        title={label}
        icon={showMenu === 'inline' ? <></> : <Icons.TriangleDown />}
      >
        {childs?.map((child: MenuObjectChildProps | string, index1: number) => {
          if (typeof child === 'string' && child === '-' && label !== 'Data') {
            return <MainNav.Divider key={`$${index1}`} />;
          }
          if (typeof child !== 'string') {
            return (
              <MainNav.Item key={`${child.label}`}>
                {child.isFrontendRoute ? (
                  <NavLink
                    to={child.url || ''}
                    exact
                    activeClassName="is-active"
                  >
                    {child.label}
                  </NavLink>
                ) : (
                  <a href={child.url}>{child.label}</a>
                )}
              </MainNav.Item>
            );
          }
          return null;
        })}
      </StyledSubMenu>
    );
  };
  return (
    <StyledHeader className="top" id="main-menu" role="navigation">
      <HeaderContainer>
        <TopRow>
          <LogoContainer>
            <Tooltip
              id="brand-tooltip"
              placement="bottomLeft"
              title={brand.tooltip}
              arrow={{ pointAtCenter: true }}
            >
              {isFrontendRoute(window.location.pathname) ? (
                <GenericLink className="navbar-brand" to={brand.path}>
                  <img src={brand.icon} alt={brand.alt} onClick={refetch}/>
                </GenericLink>
              ) : (
                <a className="navbar-brand" href={brand.path} tabIndex={-1}>
                  <img src={brand.icon} alt={brand.alt} onClick={refetch}/>
                </a>
              )}
            </Tooltip>
            {brand.text && (
              <div className="navbar-brand-text">
                <span>{brand.text}</span>
              </div>
            )}

            {/* Desktop version of search bar */}
            <SearchBarWrapper className="desktop-search">
              <SearchBar />
            </SearchBarWrapper>
          </LogoContainer>

          <NavRightContainer>
            <MainNav
              mode={showMenu}
              data-test="navbar-top"
              className="main-nav"
              selectedKeys={activeTabs}
              disabledOverflow
            >
              {menu.map((item, index) => {
                const props = {
                  index,
                  ...item,
                  isFrontendRoute: isFrontendRoute(item.url),
                  childs: item.childs?.map(c => {
                    if (typeof c === 'string') {
                      return c;
                    }

                    return {
                      ...c,
                      isFrontendRoute: isFrontendRoute(c.url),
                    };
                  }),
                };

                return renderSubMenu(props);
              })}
            </MainNav>
            <RightMenu
              align={screens.md ? 'flex-end' : 'flex-start'}
              settings={settings}
              navbarRight={navbarRight}
              isFrontendRoute={isFrontendRoute}
              environmentTag={environmentTag}
            />
          </NavRightContainer>
        </TopRow>

        {/* Mobile version of search bar (only shown on small screens) */}
        <SearchRowContainer>
          <SearchBarWrapper className="mobile-search">
            <SearchBar />
          </SearchBarWrapper>
        </SearchRowContainer>
      </HeaderContainer>
    </StyledHeader>
  );
}

// transform the menu data to reorganize components
export default function MenuWrapper({ data, ...rest }: MenuProps) {
  const newMenuData = {
    ...data,
  };

  data.menu.map(x => {
    if (x.label === 'Dashboards') {
      x.label = 'Workspaces';
      x.name = 'Workspaces';
    } else if (x.label === 'Datasets') {
      x.label = 'Explore Data';
      x.name = 'Explore Data';
    } else if (x.label === 'Charts') {
      x.label = 'Widgets';
      x.name = 'Widgets';
    }
  });

  // Menu items that should go into settings dropdown
  const settingsMenus = {
    Data: true,
    Security: true,
    Manage: true,
  };

  // Cycle through menu.menu to build out cleanedMenu and settings
  const cleanedMenu: MenuObjectProps[] = [];
  const settings: MenuObjectProps[] = [];
  newMenuData.menu.forEach((item: any) => {
    if (!item) {
      return;
    }

    const children: (MenuObjectProps | string)[] = [];
    const newItem = {
      ...item,
    };

    // Filter childs
    if (item.childs) {
      item.childs.forEach((child: MenuObjectChildProps | string) => {
        if (typeof child === 'string') {
          children.push(child);
        } else if ((child as MenuObjectChildProps).label) {
          children.push(child);
        }
      });

      newItem.childs = children;
    }

    if (!settingsMenus.hasOwnProperty(item.name)) {
      cleanedMenu.push(newItem);
    } else {
      settings.push(newItem);
    }
  });

  const updatedCleanedMenu = cleanedMenu.filter(x => x.label !== 'SQL');

  newMenuData.menu = updatedCleanedMenu;
  newMenuData.settings = settings;

  return <Menu data={newMenuData} {...rest} />;
}
