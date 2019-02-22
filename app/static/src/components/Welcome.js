import React from 'react';

import css from "../css/backgroundVideo.css"
import {Link, Redirect} from "react-router-dom";

class Welcome extends React.Component {
    
    render(){

        if (this.props.isAuth)
            return <Redirect to="/experiences" />;

        return(
            <>
                <div className="video-container">
                    <video autoPlay muted loop className="videoPlayer">
                        <source src="https://00e9e64bacf4c78c1f15dc51590c2e2228997ccc9dff263d82-apidata.googleusercontent.com/download/storage/v1/b/wondertime_media/o/background2.mp4?qk=AD5uMEvAD7oSG5OFi7sxce-MQW7gweFLykR7pE5_8l9yskThrnnYdsy63M9cZ7gyHGRqnHQkIGSDGo_A0uRRQ-1Cod30Fj9RfSKsMzm6VXdPy10YH_-BEWQp9dq47wut-CAzKKOmKR1Txn16ROO_pXD8nMFirSDnWuyiQUlVOePE02Bh_o2I9yagAp65V5DJu8iPG1-C9X_ExRsa9bEe6y-NcZUvD4qfm3fwdC5xskmpEUiEyEYevjIg8jIxkkdoyE5XTCWp4uuXnab4jCFefUhH97amZ-u5FnDnKmb7sIa7q2H0ZnGVYFpLQ-v_yja-FcPYeTfxuuf660qko083YEMnAcibqUNBMvUe1GXvT1SS3CdIMtFcxejx-x01iCiv0DDix4kop_IgCrA5DmU3a3aV69QhRgO2DigLEDHK5LwTvmx_964Yq2cQuGZEbM5FHA4OJSrnnlczasA36d0SqOmtupBlC6sWZAvAq2vIUVnMarobXF1aJIvuk3_BjSrQM0VZBXT2pP0mG38nIkEM_Q6MwkrfBka7xAcBAqeImPcEXw9Z_zBoDz0k2LqgeeEEPqOwDe4GlnDnL63xidpzATH1cd3EzJ6vU53-bS-wzfqMBh72grh5mwQlgBzqY9AHesi8PXDw6YcF2gBPLRMpDICgnhE7wVNcKAGU5MZVWtVzOTv5Z0wH5yZ810z7JKqfVXn050obesmVyDe9SFeoTUIexhkqqzMVGFBCoes4y8wT4_XDg4lKyF18EweStQbjSEoH9II0t-3KIqK-xrqB27kHFxe_cAYQdw" type="video/mp4"/>
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

