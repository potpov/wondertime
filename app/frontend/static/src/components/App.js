import React from 'react';
import {Route, Switch, BrowserRouter, Redirect} from 'react-router-dom';

/* auth dependencies */
import { Provider, connect } from "react-redux";
import {auth} from "../actions";
import myReducers from "../reducers";
import { createStore, applyMiddleware } from "redux";
import thunk from "redux-thunk";

import css from "../css/style.css";

/* web components */
import Userspace from "./Userspace";
import * as Messages from "./Messages"
import Welcome from "./Welcome"
import Loginpage from "./Loginpage"
import Timeline from "./Timeline";


let store = createStore(myReducers, applyMiddleware(thunk));

class RootContainerComponent extends React.Component {

    componentDidMount() {
        this.props.loadUser();
    }

    PrivateRoute = ({component: ChildComponent, ...rest}) => {
      return (
          <Route {...rest} render={props => {
            if (this.props.auth.isLoading) {
              return <em>Loading...</em>;
            }
            else if (!this.props.auth.isAuthenticated) {
              return <Redirect to="/" />;
            }
            else {
              return <ChildComponent {...props} />
            }
          }} />
      );
    };

    render() {
        let {PrivateRoute} = this;
        return(
          <BrowserRouter>
              <Switch>
                  <Route exact path="/" component={Welcome} />
                  <Route exact path="/login" component={Loginpage} />
                  <Route exact path="/timeline/:id" component={Timeline} />
                  <PrivateRoute exact path="/experiences" component={Userspace} />
                  <Route component={Messages.NotFound} />
              </Switch>
          </BrowserRouter>
        );
    }
}

const mapStateToProps = state => {
    return {
        auth: state.auth,
    }
};

const mapDispatchToProps = dispatch => {
  return {
    loadUser: () => {
      return dispatch(auth.loadUser());
    }
  }
};

let RootContainer = connect(mapStateToProps, mapDispatchToProps)(RootContainerComponent);

export default class App extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <RootContainer />
      </Provider>
    )
  }
}
