import React from 'react';
import Login from './Login'
import Navbar from "./Navbar";

import css from "../css/backgroundVideo.css"
import source from '../../media/background2.mp4'
import {Link, Redirect, Route} from "react-router-dom";
import connect from "react-redux/es/connect/connect";

class Welcome extends React.Component {
    
    render(){

        if (this.props.user.isAuthenticated) {
              return <Redirect to="/experiences" />;
        }

        return(
            <div>
                <Navbar homepage="active"/>

                <div className="video-container">
                    <video autoPlay muted loop className="videoPlayer">
                        <source src={source} type="video/mp4"/>
                    </video>
                </div>
                <h1 className="mt-5 ml-3">there's a fancy world out there.<br/>
                    <Link className="ml-5" to={'/login'}>> jump in</Link>
                </h1>
            </div>
        );
    }
}

const mapStateToProps = state => {
  return {
    user: state.auth,
  }
};

export default connect(mapStateToProps, null)(Welcome);

