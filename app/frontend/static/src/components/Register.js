import React, {Component} from "react";
import {connect} from "react-redux";

import {Link, Redirect} from "react-router-dom";

import {auth} from "../actions";

class Register extends Component {

  state = {
      username: "",
      password: "",
      email: "",
  };

  onRegister = e => {
    e.preventDefault();
    this.props.register(this.state.username, this.state.password, this.state.email);
  };

  render() {
    if (this.props.isAuthenticated) {
      return <Redirect to="/" />
    }
    return (
          <form onSubmit={this.onRegister}>
              <div className="form-group">
                  <label htmlFor="new-username" className="bmd-label-floating">username</label>
                  <input
                      type="text"
                      className="form-control"
                      onChange={e => this.setState({username: e.target.value})}
                      id="new-username"
                  />
              </div>
              <div className="form-group">
                  <label htmlFor="new-password" className="bmd-label-floating">Password</label>
                  <input
                      type="password"
                      className="form-control"
                      onChange={e => this.setState({password: e.target.value})}
                      id="new-password"
                  />
              </div>
              <div className="form-group">
                  <label htmlFor="new-email" className="bmd-label-floating">Email address</label>
                  <input
                      type="email"
                      className="form-control"
                      id="new-email"
                      onChange={e => this.setState({email: e.target.value})}
                  />
                      <span className="bmd-help">We'll never share your email with anyone else.</span>
              </div>
              <button type="submit" className="btn btn-primary btn-raised w-100">Sign up</button>
              {this.props.errors.length > 0 && (
                <div className="alert alert-warning mb-0" role="alert">
                  {this.props.errors[0].field}: {this.props.errors[0].message}
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
    register: (username, password, email) => dispatch(auth.register(username, password, email)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Register);