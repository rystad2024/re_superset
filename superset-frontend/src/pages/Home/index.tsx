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
import { useEffect, useMemo, useState } from 'react';
import {
  isFeatureEnabled,
  FeatureFlag,
  getExtensionsRegistry,
  JsonObject,
  styled,
  t,
} from '@superset-ui/core';
import rison from 'rison';
import Collapse from 'src/components/Collapse';
import { User } from 'src/types/bootstrapTypes';
import { reject } from 'lodash';
import {
  dangerouslyGetItemDoNotUse,
  dangerouslySetItemDoNotUse,
  getItem,
  LocalStorageKeys,
  setItem,
} from 'src/utils/localStorageHelpers';
import ListViewCard from 'src/components/ListViewCard';
import withToasts from 'src/components/MessageToasts/withToasts';
import {
  CardContainer,
  createErrorHandler,
  getRecentActivityObjs,
  getUserOwnedObjects,
  loadingCardCount,
  mq,
} from 'src/views/CRUD/utils';
import { Switch } from 'src/components/Switch';
import getBootstrapData from 'src/utils/getBootstrapData';
import { TableTab } from 'src/views/CRUD/types';
import { userHasPermission } from 'src/dashboard/util/permissionUtils';
import { WelcomePageLastTab } from 'src/features/home/types';
import ActivityTable from 'src/features/home/ActivityTable';
import { css } from '@emotion/css';
import { Link } from 'react-router-dom';
// import { Grid } from 'src/components';
import Icons from 'src/components/Icons';
import ParticleBackground from './BackgroundAnimation';

const styles = {
  welcomeContainer: css`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    position: relative;
  `,
  welcomeHeader: css`
    padding: 32px;
    border-radius: 4px;
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    max-width: fit-content;
    position: relative;
    z-index: 1;
  `,
  welcomeHeaderContent: css`
    text-align: center;
    margin: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 350px;
    position: relative;
    z-index: 1;
    color: white;
  `,
  cardsContainer: css`
    padding: 32px;
    border-radius: 4px;
    margin: auto;
    text-align: center;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    max-width: fit-content;
    margin-bottom: 60px;
  `,
  card: css`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    width: 300px;
    color: white;
    padding: 20px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
   &:hover {
      position: relative;
      color: #3B3A84;
  
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: white;
        opacity: 0.4;
        border-radius: 8px; 
        z-index: -1;
        pointer-events: none;
      }
    }   
    }
    img {
      height: 200px;
    }
  `,

  plusButton: css`
    margin-top: 16px;
    background-color: #5b67d6;
    color: white;
    padding: 3px 7px 3px 3px;
    border-radius: 14px;
    border: none;
    display: flex;
    align-items: center;
    gap: 4px;
    &:hover {
      box-shadow: 0px 4px 10px rgba(91, 103, 214, 0.4);
      color: white;
      text-decoration: none;
    }
  `,

  recentsHeader: css`
    color: #5b67d6;
    font-weight: 600;
    font-size: 12px;
    display: flex;
    justify-content: space-between;
    width: 100%;
    padding: 0px 32px;
    padding-top: 20px;
  `,
};

const extensionsRegistry = getExtensionsRegistry();

interface WelcomeProps {
  user: User;
  addDangerToast: (arg0: string) => void;
}

export interface ActivityData {
  [TableTab.Created]?: JsonObject[];
  [TableTab.Edited]?: JsonObject[];
  [TableTab.Viewed]?: JsonObject[];
  [TableTab.Other]?: JsonObject[];
}

interface LoadingProps {
  cover?: boolean;
}

const DEFAULT_TAB_ARR = ['2', '3'];

const WelcomeContainer = styled.div`
  background-color: #16213a;

  .ant-row.menu {
    margin-top: -15px;
    background: linear-gradient(135deg, #0a0a20 0%, #1a1a35 100%);
    &:after {
      content: '';
      display: block;
      border: 1px solid ${({ theme }) => theme.colors.grayscale.light2};
      margin: 0px ${({ theme }) => theme.gridUnit * 6}px;
      position: relative;
      width: 100%;
      ${mq[1]} {
        margin-top: 5px;
        margin: 0px 2px;
      }
    }
    button {
      padding: 3px 21px;
    }
  }
  .antd5-card-meta-description {
    margin-top: ${({ theme }) => theme.gridUnit}px;
  }
  .antd5-card.ant-card-bordered {
    border: 1px solid ${({ theme }) => theme.colors.grayscale.light2};
  }
  .ant-collapse-item .ant-collapse-content {
    margin-bottom: ${({ theme }) => theme.gridUnit * -6}px;
  }
  div.ant-collapse-item:last-child.ant-collapse-item-active
    .ant-collapse-header {
    padding-bottom: ${({ theme }) => theme.gridUnit * 3}px;
  }
  div.ant-collapse-item:last-child .ant-collapse-header {
    padding-bottom: ${({ theme }) => theme.gridUnit * 9}px;
  }
  .loading-cards {
    margin-top: ${({ theme }) => theme.gridUnit * 8}px;
    .antd5-card-cover > div {
      height: 168px;
    }
  }

  .welcomeContainer::before,
  .welcomeContainer::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    z-index: 0;
    height: 150px;
    background-repeat: no-repeat;
    background-size: 100% 150px;
    opacity: 0.3;
  }

  .welcomeContainer::before {
    top: 20%;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z' fill='%23ffffff'/%3E%3C/svg%3E");
  }

  .welcomeContainer::after {
    bottom: 20%;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z' fill='%23ffffff'/%3E%3C/svg%3E");
    transform: rotate(180deg);
  }
`;

// const WelcomeNav = styled.div`
//   ${({ theme }) => `
//     .switch {
//       display: flex;
//       flex-direction: row;
//       margin: ${theme.gridUnit * 4}px;
//       span {
//         display: block;
//         margin: ${theme.gridUnit}px;
//         line-height: ${theme.gridUnit * 3.5}px;
//       }
//     }
//   `}
// `;

const bootstrapData = getBootstrapData();

export const LoadingCards = ({ cover }: LoadingProps) => (
  <CardContainer showThumbnails={cover} className="loading-cards">
    {[...new Array(loadingCardCount)].map((_, index) => (
      <ListViewCard
        key={index}
        cover={cover ? false : <></>}
        description=""
        loading
      />
    ))}
  </CardContainer>
);
// const { useBreakpoint } = Grid;
function Welcome({ user, addDangerToast }: WelcomeProps) {
  // const screens = useBreakpoint();
  const canReadSavedQueries = userHasPermission(user, 'SavedQuery', 'can_read');
  const userid = user.userId;
  const id = userid!.toString(); // confident that user is not a guest user
  const params = rison.encode({ page_size: 6 });
  const recent = `/api/v1/log/recent_activity/?q=${params}`;
  const [activeChild, setActiveChild] = useState('Loading');
  const userKey = dangerouslyGetItemDoNotUse(id, null);
  let defaultChecked = false;
  const isThumbnailsEnabled = isFeatureEnabled(FeatureFlag.Thumbnails);
  if (isThumbnailsEnabled) {
    defaultChecked =
      userKey?.thumbnails === undefined ? true : userKey?.thumbnails;
  }
  const [checked, setChecked] = useState(defaultChecked);
  const [activityData, setActivityData] = useState<ActivityData | null>(null);
  const [chartData, setChartData] = useState<Array<object> | null>(null);
  const [queryData, setQueryData] = useState<Array<object> | null>(null);
  const [dashboardData, setDashboardData] = useState<Array<object> | null>(
    null,
  );
  const [isFetchingActivityData, setIsFetchingActivityData] = useState(true);

  const collapseState = getItem(LocalStorageKeys.HomepageCollapseState, []);
  const [activeState, setActiveState] = useState<Array<string>>(collapseState);

  const handleCollapse = (state: Array<string>) => {
    setActiveState(state);
    setItem(LocalStorageKeys.HomepageCollapseState, state);
  };

  const WelcomeMessageExtension = extensionsRegistry.get('welcome.message');
  const WelcomeTopExtension = extensionsRegistry.get('welcome.banner');
  const WelcomeMainExtension = extensionsRegistry.get(
    'welcome.main.replacement',
  );

  const [_otherTabTitle, otherTabFilters] = useMemo(() => {
    const lastTab = bootstrapData.common?.conf
      .WELCOME_PAGE_LAST_TAB as WelcomePageLastTab;
    const [customTitle, customFilter] = Array.isArray(lastTab)
      ? lastTab
      : [undefined, undefined];
    if (customTitle && customFilter) {
      return [t(customTitle), customFilter];
    }
    if (lastTab === 'all') {
      return [t('All'), []];
    }
    return [
      t('Examples'),
      [
        {
          col: 'created_by',
          opr: 'rel_o_m',
          value: 0,
        },
      ],
    ];
  }, []);

  useEffect(() => {
    if (!otherTabFilters || WelcomeMainExtension) {
      return;
    }
    const activeTab = getItem(LocalStorageKeys.HomepageActivityFilter, null);
    setActiveState(collapseState.length > 0 ? collapseState : DEFAULT_TAB_ARR);
    getRecentActivityObjs(user.userId!, recent, addDangerToast, otherTabFilters)
      .then(res => {
        const data: ActivityData | null = {};
        data[TableTab.Other] = res.other;
        if (res.viewed) {
          const filtered = reject(res.viewed, ['item_url', null]).map(r => r);
          data[TableTab.Viewed] = filtered;
          if (!activeTab && data[TableTab.Viewed]) {
            setActiveChild(TableTab.Viewed);
          } else if (!activeTab && !data[TableTab.Viewed]) {
            setActiveChild(TableTab.Created);
          } else setActiveChild(activeTab || TableTab.Created);
        } else if (!activeTab) setActiveChild(TableTab.Created);
        else setActiveChild(activeTab);
        setActivityData(prevActivityData => ({ ...prevActivityData, ...data }));
      })
      .catch(
        createErrorHandler((errMsg: unknown) => {
          setActivityData(activityData => ({
            ...activityData,
            [TableTab.Viewed]: [],
          }));
          addDangerToast(
            t('There was an issue fetching your recent activity: %s', errMsg),
          );
        }),
      );

    // Sets other activity data in parallel with recents api call
    const ownSavedQueryFilters = [
      {
        col: 'created_by',
        opr: 'rel_o_m',
        value: `${id}`,
      },
    ];
    Promise.all([
      getUserOwnedObjects(id, 'dashboard')
        .then(r => {
          setDashboardData(r);
          return Promise.resolve();
        })
        .catch((err: unknown) => {
          setDashboardData([]);
          addDangerToast(
            t('There was an issue fetching your dashboards: %s', err),
          );
          return Promise.resolve();
        }),
      getUserOwnedObjects(id, 'chart')
        .then(r => {
          setChartData(r);
          return Promise.resolve();
        })
        .catch((err: unknown) => {
          setChartData([]);
          addDangerToast(t('There was an issue fetching your chart: %s', err));
          return Promise.resolve();
        }),
      canReadSavedQueries
        ? getUserOwnedObjects(id, 'saved_query', ownSavedQueryFilters)
            .then(r => {
              setQueryData(r);
              return Promise.resolve();
            })
            .catch((err: unknown) => {
              setQueryData([]);
              addDangerToast(
                t('There was an issue fetching your saved queries: %s', err),
              );
              return Promise.resolve();
            })
        : Promise.resolve(),
    ]).then(() => {
      setIsFetchingActivityData(false);
    });
  }, [user?.userId, otherTabFilters, recent]);

  const handleToggle = () => {
    setChecked(!checked);
    dangerouslySetItemDoNotUse(id, { thumbnails: !checked });
  };

  useEffect(() => {
    if (!collapseState && queryData?.length) {
      setActiveState(prevState => [...prevState, '4']);
    }

    setActivityData(prev => ({
      ...prev,
      Created: [
        ...(chartData?.slice(0, 3) || []),
        ...(dashboardData?.slice(0, 3) || []),
        ...(queryData?.slice(0, 3) || []),
      ],
    }));
  }, [chartData, queryData, dashboardData]);

  useEffect(() => {
    if (!collapseState && activityData?.[TableTab.Viewed]?.length) {
      setActiveState(activeState => ['1', ...activeState]);
    }
  }, [activityData]);

  // const isRecentActivityLoading =
  //   !activityData?.[TableTab.Other] && !activityData?.[TableTab.Viewed];

  // const menuData: SubMenuProps = {
  //   activeChild: 'Home',
  //   name: t('Home'),
  // };

  // if (isThumbnailsEnabled) {
  //   menuData.buttons = [
  //     {
  //       name: (
  //         <WelcomeNav>
  //           <div className="switch">
  //             <Switch checked={checked} onClick={handleToggle} />
  //             <span>{t('Thumbnails')}</span>
  //           </div>
  //         </WelcomeNav>
  //       ),
  //       onClick: handleToggle,
  //       buttonStyle: 'link',
  //     },
  //   ];
  // }

  return (
    <>
      {/* {SubmenuExtension ? (
        <SubmenuExtension {...menuData} />
      ) : (
        <SubMenu {...menuData} />
      )} */}
      <WelcomeContainer>
        {WelcomeMessageExtension && <WelcomeMessageExtension />}
        {WelcomeTopExtension && <WelcomeTopExtension />}
        {WelcomeMainExtension && <WelcomeMainExtension />}
        {(!WelcomeTopExtension || !WelcomeMainExtension) && (
          <>
            <div className={styles.welcomeContainer}>
              <ParticleBackground />
              <div className={styles.welcomeHeader}>
                <div className={styles.welcomeHeaderContent}>
                  <h1>Cube Browser</h1>
                  <p>
                    Here you can find our data visualization tools, create
                    workspaces, export data and visual elemets.
                  </p>
                </div>
              </div>
              <div className={styles.cardsContainer}>
                <Link to="/workspaces/list" style={{ textDecoration: 'none' }}>
                  <div className={styles.card}>
                    <img
                      src="/static/assets/images/home-workspace.svg"
                      alt="Workspaces"
                    />
                    <h3>Workspaces</h3>
                    <p>An environment to create and manage your analysis</p>
                    <a
                      onClick={() => window.location.assign('/dashboard/new')}
                      className={styles.plusButton}
                    >
                      <Icons.Plus /> Create
                    </a>
                  </div>
                </Link>
                <Link to="/chart/list" style={{ textDecoration: 'none' }}>
                  <div className={styles.card}>
                    <img src="/static/assets/images/home-widgets.svg" />
                    <h3>Widgets</h3>
                    <p>An interactive component to query and visualize data</p>
                    <Link to="/chart/add/" className={styles.plusButton}>
                      <Icons.Plus /> Create
                    </Link>
                  </div>
                </Link>
                <Link to="/exploredata/list" style={{ textDecoration: 'none' }}>
                  <div className={styles.card}>
                    <img src="/static/assets/images/home-exploredata.svg" />
                    <h3>Explore Data</h3>
                    <p>All Rystad Energy databases at your fingertips</p>
                    <Link to="/dataset/add/" className={styles.plusButton}>
                      <Icons.Plus /> Create
                    </Link>
                  </div>
                </Link>
              </div>
            </div>
            <div
              style={{
                backgroundColor: 'white',
              }}
            >
              <div
                style={{
                  maxWidth: '1008px',
                  margin: 'auto',
                }}
              >
                <div className={styles.recentsHeader}>
                  <h4>Recents</h4>
                  <div className="switch">
                    <Switch checked={checked} onClick={handleToggle} />
                    <span style={{ marginLeft: '6px' }}>{t('Thumbnails')}</span>
                  </div>
                </div>
                {activityData &&
                (activityData[TableTab.Viewed] ||
                  activityData[TableTab.Other] ||
                  activityData[TableTab.Created]) &&
                activeChild !== 'Loading' ? (
                  <ActivityTable
                    user={{ userId: user.userId! }} // user is definitely not a guest user on this page
                    activeChild={activeChild}
                    setActiveChild={setActiveChild}
                    activityData={activityData}
                    isFetchingActivityData={isFetchingActivityData}
                    showThumbnails={checked}
                  />
                ) : (
                  <LoadingCards />
                )}
                <Collapse
                  activeKey={activeState}
                  onChange={handleCollapse}
                  ghost
                  bigger
                >
                  {/* <Collapse.Panel header={t('Recents')} key="1"></Collapse.Panel>
              <Collapse.Panel header={t('Workspaces')} key="2">
                {!dashboardData || isRecentActivityLoading ? (
                  <LoadingCards cover={checked} />
                ) : (
                  <DashboardTable
                    user={user}
                    mine={dashboardData}
                    showThumbnails={checked}
                    otherTabData={activityData?.[TableTab.Other]}
                    otherTabFilters={otherTabFilters}
                    otherTabTitle={otherTabTitle}
                  />
                )}
              </Collapse.Panel>
              <Collapse.Panel header={t('Widgets')} key="3">
                {!chartData || isRecentActivityLoading ? (
                  <LoadingCards cover={checked} />
                ) : (
                  <ChartTable
                    showThumbnails={checked}
                    user={user}
                    mine={chartData}
                    otherTabData={activityData?.[TableTab.Other]}
                    otherTabFilters={otherTabFilters}
                    otherTabTitle={otherTabTitle}
                  />
                )}
              </Collapse.Panel> */}
                  {/* {canReadSavedQueries && (
                <Collapse.Panel header={t('Saved queries')} key="4">
                  {!queryData ? (
                    <LoadingCards cover={checked} />
                  ) : (
                    <SavedQueries
                      showThumbnails={checked}
                      user={user}
                      mine={queryData}
                      featureFlag={isThumbnailsEnabled}
                    />
                  )}
                </Collapse.Panel>
              )} */}
                </Collapse>
              </div>
            </div>
          </>
        )}
      </WelcomeContainer>
    </>
  );
}

export default withToasts(Welcome);
