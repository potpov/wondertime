import React from 'react';
import {Redirect} from 'react-router-dom';
import Login from "./Login";
import Register from "./Register";

class loginpage extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            status: 'LOGIN'
        }
    }

    switchForm(){
        this.state.status === 'LOGIN'
        ? this.setState({status: 'REGISTER'})
        : this.setState({status: 'LOGIN'})
    }

    render(){

        if (this.props.isAuth) {
              return <Redirect to="/experiences" />;
        }


        return(
            <>
                <div className="login-page"> </div>
                <div className="row mr-0">
                    <div className="col"> </div>
                    <div className="card col-12 col-md-5 col-lg-5">
                        <div className="card-body">
                            <h5 className="card-title">create timelines from your memories</h5>
                            {this.state.status === 'LOGIN'
                                ?   <Login
                                        signIn={this.props.signIn.bind(this)}
                                        isAuth={this.props.isAuth}
                                        switch={this.switchForm.bind(this)}
                                    />
                                :
                                    <Register
                                        signUp={this.props.signUp.bind(this)}
                                        isAuth={this.props.isAuth}
                                        switch={this.switchForm.bind(this)}
                                    />
                            }
                        </div>
                    </div>
                    <div className="col"> </div>
                </div>
            </>
        );
    }
}

export default loginpage;

