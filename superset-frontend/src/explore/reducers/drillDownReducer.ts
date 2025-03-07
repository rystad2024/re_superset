import { AnyDrilldownAction, SET_DRILLDOWN_DATA, SET_WORKSPACE_TITLE } from '../actions/drillDownAction';

const initialState = {
  drilldownData: {},   
  workspaceTitle: "",  
};

export default function drilldownReducer(state = initialState, action: AnyDrilldownAction) {
  switch (action.type) {
    case SET_DRILLDOWN_DATA:
      return {
        ...state,
        drilldownData: {
          ...state.drilldownData,
          [action.chartId]: action.data,
        },
      };
      
    case SET_WORKSPACE_TITLE:
      return {
        ...state,
        workspaceTitle: action.title,  
      };

    default:
      return state;
  }
}
