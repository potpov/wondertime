import { combineReducers } from 'redux';
import auth from "./auth";

const myReducers = combineReducers({
  auth,
});

export default myReducers