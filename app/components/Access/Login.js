import React, {Component} from "react";

class Login extends Component {

    state = {
        username: "",
        password: "",
    };

    onLogin = e => {
        e.preventDefault();
        this.props.signIn(this.state.username, this.state.password); // handled by App
    };

    componentDidMount(){
        this.nameInput.focus();
    }

  render() {

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
              <div className="alert alert-light" role="alert">
                  don't you have an account?
                  <a href="#" onClick={this.props.switch} className="ml-1 alert-link">sign up!</a>
              </div>
          </form>
    )
  }
}


export default Login;
