import React from 'react';

class Banner extends React.Component {

    renderMessages(){
        if(this.props.messages){
            return(
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                    {this.props.messages}
                    <button type="button" onClick={this.props.onReset} className="close" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
            );
        }
    }

    renderErrors(){
        if(this.props.errors){
            return(
                <div className="alert alert-warning fade show" role="alert">
                    {this.props.errors}
                    <button type="button" onClick={this.props.onReset} className="close" aria-label="Close">
                        <span  aria-hidden="true">&times;</span>
                    </button>
                </div>
            );
        }
    }

    render(){
        return(
            <div className="w-50 mx-auto fixed-bottom">
                {this.renderErrors()}
                {this.renderMessages()}
            </div>

        );
    }
}


export default Banner
