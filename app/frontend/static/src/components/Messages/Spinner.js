import React from 'react';
import css from "../../css/spinner.css";

class Spinner extends React.Component {
    render(){
        return(
            <div className="spinner-position">
                <div className="lds-ripple">
                    <div> </div>
                    <div> </div>
                </div>
            </div>
        );
    }
}


export default Spinner