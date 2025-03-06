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
import { SubMenuProps } from 'src/features/home/SubMenu';
import { userHasPermission } from 'src/dashboard/util/permissionUtils';
import { WelcomePageLastTab } from 'src/features/home/types';
import ActivityTable from 'src/features/home/ActivityTable';
import { css } from '@emotion/css';
import { Link } from 'react-router-dom';

const styles = {
  welcomeContainer: css`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
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
  `,
  welcomeHeaderContent: css`
    text-align: center;
    margin: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 350px;
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
  `,
  card: css`
    width: 300px;
    border-radius: 4px;
    margin: auto;
    text-align: center;
    display: flex;
    gap: 8px;
    flex-direction: column;
    padding: 20px;
    border-radius: 20px;
    &:hover {
      background-color: #e6ecf2;
    }
  `,
  exploreDateCard: css`
    width: 300px;
    margin: auto;
    text-align: center;
    display: flex;
    gap: 8px;
    flex-direction: column;
    padding: 20px;
    border-radius: 20px;
    &:hover {
      background-color: #e6ecf2;
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
  background-color: ${({ theme }) => theme.colors.secondary.light5};
  .ant-row.menu {
    margin-top: -15px;
    background-color: ${({ theme }) => theme.colors.grayscale.light4};
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

function Welcome({ user, addDangerToast }: WelcomeProps) {
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
        setActivityData(activityData => ({ ...activityData, ...data }));
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
  }, [otherTabFilters]);

  const handleToggle = () => {
    setChecked(!checked);
    dangerouslySetItemDoNotUse(id, { thumbnails: !checked });
  };

  useEffect(() => {
    if (!collapseState && queryData?.length) {
      setActiveState(activeState => [...activeState, '4']);
    }
    setActivityData(activityData => ({
      ...activityData,
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
                    <img src="/static/assets/images/home-workspace.svg" />
                    <h3>Workspaces</h3>
                    <p>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                      sed do eiusmod tempor incididunt
                    </p>
                    <a
                      onClick={() => {
                        window.location.assign('/dashboard/new');
                      }}
                    >
                      Create Workspace
                    </a>
                  </div>
                </Link>
                <Link to="/chart/list" style={{ textDecoration: 'none' }}>
                  <div className={styles.card}>
                    <img src="/static/assets/images/home-widgets.svg" />
                    <h3>Widgets</h3>
                    <p>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                      sed do eiusmod tempor incididunt
                    </p>
                    <Link to="/chart/add/">Create Widget</Link>
                  </div>
                </Link>
                <Link to="/exploredata/list" style={{ textDecoration: 'none' }}>
                  <div className={styles.exploreDateCard}>
                    <img src="/static/assets/images/home-exploredata.svg" />
                    <h3>Explore Data</h3>
                    <p>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                      sed do eiusmod tempor incididunt
                    </p>
                    <Link to="/dataset/add/">Create Dataset</Link>
                  </div>
                </Link>
              </div>
            </div>
            <div style={{ backgroundColor: 'white' }}>
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
          </>
        )}
      </WelcomeContainer>
    </>
  );
}

export default withToasts(Welcome);
