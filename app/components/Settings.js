import React from 'react';
import {Redirect} from "react-router-dom";
import * as Messages from "./Messages";

class Settings extends React.Component {

     constructor(props) {
        super(props);
        this.state = {
            status: 'LOADING',
            redirect_home: false,
            password: ''
        };
    }

    componentDidMount() {
        this.loadSettings();
    }

    updatePasswordValue(evt) {
        this.setState({
          password: evt.target.value
        });
    }

    handleErrors(result) {
        if(result.error)
            throw result.error;
        return result;
    }

    loadSettings(){
        this.setState({status: 'LOADING' });
        if (!this.props.isAuth || !this.props.token) {
            this.setState({status: 'LOADED'});
            return;
        }

        let headers = {
            "Content-Type": "application/json",
            "Authorization": `Token ${this.props.token}`,
        };

        return fetch('/API/user/details/', {headers})
            .then(res => res.json())
            .then(this.handleErrors)
            .then(
                (result) => {
                    this.setState({
                        status: 'LOADED',
                        username: result.username,
                        email: result.email,
                        registeredOn: result.registered_on,
                        redirect_home: false,
                    });
                }
            ).catch((error) => {
                this.setState({
                    status: 'LOADED',
                    redirect_home: true
                });
                this.props.raiseError(error);
        });
    }

    changePassword(){
        this.setState({status: 'LOADING' });
        let headers = {"Content-Type": "application/json"};
        if (this.props.token) {
          headers["Authorization"] = `Token ${this.props.token}`;
        }
        let body = JSON.stringify({'password': this.state.password});

        fetch("/API/user/update", {headers, body, method: "POST"})
            .then(res => res.json())
            .then(this.handleErrors)
            .then(
                (result) => {
                    this.props.raiseMessage(result.message);
                    this.setState({status: 'LOADED' });
                }
            ).catch((error) => {
                this.props.raiseError(error);
                this.setState({status: 'LOADED' });
        });
    }


    render(){
        const {status, redirect_home} = this.state;

        // prevent guests to open this page unless it is from another account
        if (!this.props.isAuth && status !== 'LOADING')
            return <Redirect to="/login"/>;

        if (redirect_home)
            return <Redirect to="/"/>;

        switch(status) {

            case 'LOADED':
                return (
                    <div className="accordion m-2" id="accordionExample">
                        <div className="card">
                            <div className="card-header" id="headingOne">
                                <h2 className="mb-0">
                                    <button className="btn btn-link" type="button" data-toggle="collapse"
                                            data-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                                        email
                                    </button>
                                </h2>
                            </div>

                            <div id="collapseOne" className="collapse show" aria-labelledby="headingOne"
                                 data-parent="#accordionExample">
                                <div className="card-body">
                                    your email is <b>{this.state.email}</b> <br/>
                                    to change this email please contact us.
                                </div>
                            </div>
                        </div>
                        <div className="card">
                            <div className="card-header" id="headingTwo">
                                <h2 className="mb-0">
                                    <button className="btn btn-link collapsed" type="button" data-toggle="collapse"
                                            data-target="#collapseTwo" aria-expanded="false"
                                            aria-controls="collapseTwo">
                                        registration date
                                    </button>
                                </h2>
                            </div>
                            <div id="collapseTwo" className="collapse" aria-labelledby="headingTwo"
                                 data-parent="#accordionExample">
                                <div className="card-body">
                                    you jumped in on {this.state.registeredOn}
                                </div>
                            </div>
                        </div>
                        <div className="card">
                            <div className="card-header" id="headingThree">
                                <h2 className="mb-0">
                                    <button className="btn btn-link collapsed" type="button" data-toggle="collapse"
                                            data-target="#collapseThree" aria-expanded="false"
                                            aria-controls="collapseThree">
                                        change password
                                    </button>
                                </h2>
                            </div>
                            <div id="collapseThree" className="collapse" aria-labelledby="headingThree"
                                 data-parent="#accordionExample">
                                <div className="card-body">
                                    you can change your password here <br/>
                                    <form className="form-inline">
                                        <span className="bmd-form-group">
                                            <div className="dropdown">
                                                <input
                                                    className="form-control mr-sm-2"
                                                    type="password"
                                                    aria-label="password"
                                                    value={this.state.password}
                                                    onChange={this.updatePasswordValue.bind(this)}
                                                />
                                                <button
                                                    className="btn btn-outline-info my-2 my-sm-0"
                                                    onClick={this.changePassword.bind(this)}>change
                                                </button>
                                            </div>
                                        </span>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'LOADING':
            default:
                return (<Messages.Spinner/>);
        }
    }
}

export default Settings;

