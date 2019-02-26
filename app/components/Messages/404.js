import React from 'react';

class Notfound extends React.Component {
    render(){

        return(
            <div className="container h-100 d-flex justify-content-center mt-5">
                    <div className="error-section text-center">
                        <img src="/static/assets/404_kitty.png"/>
                        <i><b>404</b> not found</i>
                    </div>
            </div>
        );
    }
    
}

export default Notfound