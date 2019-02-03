import React from 'react';

// unlike of spinner this class dinamically update his progress bar and must be feed with the process status

class Loader extends React.Component {
    render(){
        return(
            <div className="progress">
                <div className="progress-bar" role="progressbar" aria-valuenow={this.props.status} aria-valuemin="0"
                     aria-valuemax="100"> </div>
            </div>
        );
    }
}


export default Loader
