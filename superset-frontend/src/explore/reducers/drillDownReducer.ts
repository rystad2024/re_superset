import { AnyDrilldownAction, SET_DRILLDOWN_DATA } from '../actions/drillDownAction';

const initialState = {}; // Ensure initial state is an empty object

export default function drilldownReducer(
  state = initialState,
  action: AnyDrilldownAction,
) {
  if (action.type === SET_DRILLDOWN_DATA) {
    return {
      ...state,
      [action.chartId]: action.data, // Update drill-down data for a specific chart
    };
  }
  return state;
}
