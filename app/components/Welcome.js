import React from 'react';

import {Link, Redirect} from "react-router-dom";

class Welcome extends React.Component {
    
    render(){

        if (this.props.isAuth)
            return <Redirect to="/experiences" />;

        return(
            <>
                <div className="video-container">
                    <video autoPlay muted loop className="videoPlayer">
                        <source src="/static/assets/homepage_bg.mp4" type="video/mp4"/>
                    </video>
                </div>
                <h1 className="mt-5 ml-3 welcome-title">there's a fancy world out there.<br/>
                    <Link className="ml-5" to={'/login'}>> jump in</Link>
                </h1>
            </>
        );
    }
}


export default Welcome;

