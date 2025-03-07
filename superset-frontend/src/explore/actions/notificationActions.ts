export const SET_WORKSPACE_TITLE = 'SET_WORKSPACE_TITLE';
export const SET_NOTIFICATION = 'SET_NOTIFICATION';

export interface SetNotification {
    type: typeof SET_NOTIFICATION;
    notification: string;
}

export function setNotification(notification: string): SetNotification {
    return { type: SET_NOTIFICATION, notification };
}

export const drilldownActions = {
  setNotification,
};

export type AnyDrilldownAction =  SetNotification;
