import React from 'react';
import { BrowserRouter as Router, Route } from "react-router-dom";
import { withCookies, Cookies } from 'react-cookie';
import { instanceOf } from 'prop-types';

/* web components */
import Userspace from "./Userspace";
import * as Messages from "./Messages"
import Welcome from "./Welcome"
import Access from "./Access/Access"
import Timeline from "./Timeline";
import Navbar from "./Navbar";

const RouteWithProps = ({ path, exact, component:Component, ...rest }) => (
  <Route
    path={path}
    exact={exact}
    render={(props) => <Component {...props} {...rest} />}
    />
);

class App extends React.Component {

    constructor(props) {
        super(props);
        const { cookies } = props;
        this.state = {
            token: cookies.get('token'),
            logs: null
        };
    }

    componentDidMount(){
        this.loadUser();
    }

    /*  FOLLOWING METHODS ARE USED TO LOGIN/LOGOUT/REGISTER USERS
        those methods are propagated down to the child components
     */

    // raise an exception is there's an error in a query
    handleErrors(result) {
        if(result.error)
            throw result.error;
        return result;
    }

    // checks if current token is valid
    loadUser() {
        const token = this.state.token;
        if (!token){
            this.setState({isAuth: false});
            return;
        }

        let headers = {
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`,
        };
        return fetch("/API/user/auth", {headers,})
            .then(response => response.json())
            .then(this.handleErrors)
            .then(
                (result) => {
                    this.setState({isAuth: true, username: result.user});
                }
            ).catch((error) => {
                this.setState({isAuth: false});
                this.raiseError(error);
            });
    }

    // login an user
    signIn(username, password){
        let headers = {"Content-Type": "application/json",};
        let body = JSON.stringify({username, password});
        return fetch("/API/user/signin", {headers, body, method: "POST"})
            .then(response => response.json())
            .then(this.handleErrors)
            .then(
                (result) => {
                    const { cookies } = this.props;
                    this.setState({
                        isAuth: true,
                        username: result.username,
                        token: result.token
                    });
                    cookies.set('token', result.token, { path: '/' }); // save the token in cookies also
                }
            ).catch((error) => {
                this.setState({isAuth: false});
                this.raiseError(error);
            });
    }

    // logout an user
    signOut(){
        const token = this.state.token;
        let headers = {
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`,
        };
        return fetch("/API/user/logout", {headers, body: "", method: "POST"})
            .then(response => response.json())
            .then(this.handleErrors)
            .then(
                (result) => {
                    this.setState({
                        isAuth: false,
                        username: null,
                        token: null,
                    });
                    const { cookies } = this.props;
                    cookies.set(
                        'token', '', {
                            path: '/',
                            //expires: 'Thu, 01 Jan 1970 00:00:01 GMT'
                        }); // destroy cookie
                    this.raiseMessage(result.message);
                }
            ).catch((error) => {
                this.setState({isAuth: false});
                this.raiseError(error);
            });
    }

    // create a new user and execute the login
    signUp(username, password, email){
        let headers = {"Content-Type": "application/json",};
        let body = JSON.stringify({username, password, email});
        return fetch("/API/user/signup", {headers, body, method: "POST"})
            .then(response => response.json())
            .then(this.handleErrors)
            .then(
                (result) => {
                    const { cookies } = this.props;
                    this.setState({
                        isAuth: true,
                        username: result.username,
                        token: result.token
                    });

                    cookies.set('token', result.token, { path: '/' }); // save the token in cookies also
                }
            ).catch((error) => {
                this.setState({isAuth: false});
                this.raiseError(error)
            });
    }

    /*  FOLLOWING METHODS ARE USED TO CREATE ERROR MESSAGES
        OR INFO MESSAGES
        those methods are used in this class and also propagated
        to child components.
        render is executed at the end of this child with a custom
        component
     */

    raiseError(error){
        this.setState({ errors: error, });
        setTimeout( () => {this.cleanLogs();}, 2500);
    }

    raiseMessage(message){
        this.setState({ messages: message, });
        setTimeout( () => {this.cleanLogs();}, 2500);
    }

    cleanLogs(){
        this.setState({
            errors: null,
            messages: null,
        });
    }


    render() {
        const {isAuth, token} = this.state;
        return(
                <Router>
                    <>
                        <Navbar
                            signOut={this.signOut.bind(this)}
                            isAuth={isAuth}
                        />

                        <RouteWithProps
                            exact path="/"
                            component={Welcome}
                            isAuth={isAuth}
                        />

                        <RouteWithProps
                            exact path="/login"
                            component={Access}
                            isAuth={isAuth}
                            signIn={this.signIn.bind(this)}
                            signUp={this.signUp.bind(this)}
                        />

                        <RouteWithProps
                            exact path="/experiences"
                            component={Userspace}
                            isAuth={isAuth}
                            token={token}
                            raiseError={this.raiseError.bind(this)}
                            raiseMessage={this.raiseMessage.bind(this)}
                        />

                        <RouteWithProps
                            path="/timeline/:id/:marker?"
                            component={Timeline}
                            token={token}
                            raiseError={this.raiseError.bind(this)}
                            raiseMessage={this.raiseMessage.bind(this)}
                        />

                         <Messages.Banner
                             errors={this.state.errors}
                             messages={this.state.messages}
                             onReset={this.cleanLogs.bind(this)}
                         />
                    </>
                </Router>
        );

    }

  static propTypes = {
    cookies: instanceOf(Cookies).isRequired
  };

}

export default withCookies(App);
