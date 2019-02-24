import React from 'react';

class FirstChooser extends React.Component {

    changeStatus(newStatus){
        this.props.onStatus(newStatus);
    }

    render(){
        return(
            <div className="container-fluid">
                <div className="row">
                    <div className="col-sm text-center pt-5 pb-5 media_chooser"
                         onClick={() =>this.changeStatus('picture')}>
                        <i className="fas fa-images"> </i>
                    </div>
                    <div className="col-sm text-center pt-5 pb-5 media_chooser"
                         onClick={() => this.changeStatus('video')}>
                        <i className="fas fa-video"> </i>
                    </div>
                    <div className="col-sm text-center pt-5 pb-5 media_chooser"
                         onClick={() =>this.changeStatus('caption')}>
                        <i className="fas fa-pen"> </i>
                    </div>
                </div>
            </div>
        );
    }
}

export default FirstChooser
