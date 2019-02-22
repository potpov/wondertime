import React from 'react';

import css from "../css/backgroundVideo.css"
import source from '../../media/background2.mp4'
import {Link, Redirect} from "react-router-dom";

class Welcome extends React.Component {
    
    render(){

        if (this.props.isAuth)
            return <Redirect to="/experiences" />;

        return(
            <>
                <div className="video-container">
                    <video autoPlay muted loop className="videoPlayer">
                        <source src={source} type="video/mp4"/>
                    </video>
                </div>
                <h1 className="mt-5 ml-3">there's a fancy world out there.<br/>
                    <Link className="ml-5" to={'/login'}>> jump in</Link>
                </h1>
            </>
        );
    }
}


export default Welcome;

