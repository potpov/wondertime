import React from 'react';

class Deleter extends React.Component {

    render(){
        return (
            <span className="clickable close-icon" onClick={this.props.onDelete}>
                <i className="fa fa-times"> </i>
            </span>
        );
    }

}

export default Deleter
