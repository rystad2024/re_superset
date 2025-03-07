import {
  AnyDrilldownAction,
  SET_NOTIFICATION,
} from '../actions/notificationActions';

const initialState = {
  notification: "",
};

export default function notificationReducer(
  state = initialState,
  action: AnyDrilldownAction,
) {
  switch (action.type) {
    case SET_NOTIFICATION:
      return {
        ...state,
        notification: action.notification,
      };
      default:
        return state;
  }
}
