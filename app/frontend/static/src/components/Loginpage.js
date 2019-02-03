import React from 'react';
import {Link, Redirect} from 'react-router-dom';

import connect from "react-redux/es/connect/connect";
import Navbar from "./Navbar"
import Login from "./Login";
import Register from "./Register";

class loginpage extends React.Component {

    render(){

        if (this.props.user.isAuthenticated) {
              return <Redirect to="/experiences" />;
        }


        return(
            <div>
                <Navbar log/>
                <div className="login-page"> </div>

                <div id="accordion" className="mt-5 w-50 mx-auto">
                    <div className="card">
                        <div className="card-body text-center">
                            <h3>create timelines from your memories <br/>
                                share them on
                                <i className="fab fa-instagram ml-3"> </i>
                            </h3>
                        </div>
                    </div>


                    <div className="card">
                        <h4 className="text-center text-uppercase mt-3 login-title" data-toggle="collapse" data-target=".toggle"
                                aria-expanded="true" aria-controls="loginSection">
                            sign in
                        </h4>
                        <div className="toggle collapse show" aria-labelledby="headingOne" data-parent="#accordion">
                            <div className="card-body w-50 mx-auto">
                                <Login/>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h4 className="text-center text-uppercase login-title" data-toggle="collapse" data-target=".toggle"
                                aria-expanded="false" aria-controls="registerSection">
                            first time here? sign up
                        </h4>
                        <div className="toggle collapse" aria-labelledby="headingTwo" data-parent="#accordion">
                            <div className="card-body w-50 mx-auto">
                                <Register/>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        );
    }
}

const mapStateToProps = state => {
  return {
    user: state.auth,
  }
};

export default connect(mapStateToProps, null)(loginpage);

