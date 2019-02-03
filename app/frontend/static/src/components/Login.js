import React, {Component} from "react";
import {connect} from "react-redux";

import {Link, Redirect} from "react-router-dom";
import {auth} from "../actions";

import css from '../css/loginPage.css'

class Login extends Component {

    state = {
        username: "",
        password: "",
    };

    onLogin = e => {
        e.preventDefault();
        this.props.login(this.state.username, this.state.password);
    };

    componentDidMount(){
        this.nameInput.focus();
    }

  render() {

    if (this.props.isAuthenticated) {
        return <Redirect to="/experiences" />
    }

    return (
          <form onSubmit={this.onLogin}>
              <div className="form-group">
                  <label htmlFor="username" className="bmd-label-floating">username</label>
                  <input
                      type="text"
                      className="form-control"
                      onChange={e => this.setState({username: e.target.value})}
                      id="username"
                      ref={(input) => { this.nameInput = input; }}
                  />
              </div>
              <div className="form-group">
                  <label htmlFor="password" className="bmd-label-floating">Password</label>
                  <input
                      type="password"
                      className="form-control"
                      onChange={e => this.setState({password: e.target.value})}
                      id="password"
                  />
              </div>
              <button type="submit" className="btn btn-primary btn-raised w-100">Login</button>
              {this.props.errors.length > 0 && (
                <div className="alert alert-warning mb-0" role="alert">
                  {this.props.errors[0].message}
                </div>
            )}
          </form>
    )
  }
}

const mapStateToProps = state => {
  let errors = [];
  if (state.auth.errors) {
    errors = Object.keys(state.auth.errors).map(field => {
      return {field, message: state.auth.errors[field]};
    });
  }
  return {
    errors,
    isAuthenticated: state.auth.isAuthenticated
  };
};

const mapDispatchToProps = dispatch => {
  return {
    login: (username, password) => {
      return dispatch(auth.login(username, password));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Login);
