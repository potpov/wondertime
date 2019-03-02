import React from 'react';

class Empty extends React.Component {

    render(){
        if(this.props.admin)
            return(
                <div className="container h-100 d-flex justify-content-center mt-5">
                        <div className="error-section">
                            create content from the buttons above
                        </div>
                </div>
            );
        else
            return(
                <div className="container h-100 d-flex justify-content-center mt-5">
                        <div className="error-section">
                            <img src="/static/assets/404_kitty.jpg"/>
                            <i><b>nothing here yet.</b></i>
                        </div>
                </div>
            );
    }

}

export default Empty