import React, {Component} from "react";

import {Redirect} from "react-router-dom";

class Register extends Component {

  state = {
      username: "",
      password: "",
      email: "",
  };

  onRegister = e => {
    e.preventDefault();
    this.props.signUp(this.state.username, this.state.password, this.state.email);
  };

  render() {
    if (this.props.isAuth) {
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
              <div className="alert alert-light" role="alert">
                  already have an account?
                  <a href="#" onClick={this.props.switch} className="ml-1 alert-link">sign in!</a>
              </div>
          </form>
    )
  }
}

export default Register;