import React from 'react';
import PictureChooser from './PictureChooser';
import FirstChooser from "./FirstChooser";
import CaptionChooser from "./CaptionChooser";
import VideoChooser from "./VideoChooser";


function createObjectURL(object) {
    return (window.URL) ? window.URL.createObjectURL(object) : window.webkitURL.createObjectURL(object);
}



class Adder extends React.Component {


    getInitialState() {
        return {
            status: 'init',
            type: null,
            file: [],
            src: [],
            caption: '',
            place: '',
            message: '',
        };
    }


    constructor(props) {
        super(props);
        this.state = this.getInitialState();
    }

    /* ask google for places and coords while user is typing */

    loadcoords(){

    }

    /* picture loader */

    loadPic(e){
        const files = Array.from(e.target.files);
        var data = this.state.file;
        var src = this.state.src;
        files.forEach((file) => {
          data.push(file);
          src.push(createObjectURL(file))
        });
        this.setState({
            file: data,
            src: src,
        })
    }

    /* video loader */

    loadVideo(e){
        if(e.target.files.length !== 1) {
            this.setState({message: 'please set one video.'})
            return;
        }
        let data = e.target.files[Object.keys(e.target.files)[0]];
        let src = createObjectURL(data);
        this.setState({
            file: data,
            src: src,
            message: 'video is ready to be loaded.'
        })
    }

    /* generic media loaders */

    loadPlace(e){
        this.setState({place: e.target.value})
    }

    loadCaption(e){
        this.setState({caption: e.target.value})
    }

    /* status loader */

    changeStatus(newStatus){
        this.setState({status: newStatus})
    }

    renderModalBody(){
        switch (this.state.status) {
            case 'picture':
                return <PictureChooser
                    onPlace={(e) => this.loadPlace(e)}
                    onCaption={(e) => this.loadCaption(e)}
                    onPicture={this.loadPic.bind(this)}
                    previews={this.state.src}
                    placehit={this.props.placehit}
                />;
            case 'video':
                return <VideoChooser
                    onPlace={(e) => this.loadPlace(e)}
                    onCaption={(e) => this.loadCaption(e)}
                    onVideo={this.loadVideo.bind(this)}
                    message={this.state.message}
                    placehit={this.props.placehit}
                />;
            case 'caption':
                return <CaptionChooser
                    onPlace={(e) => this.loadPlace(e)}
                    onCaption={(e) => this.loadCaption(e)}
                    placehit={this.props.placehit}
                />;

            case 'init':
            default:
                return <FirstChooser
                    onStatus={(newStatus) => this.changeStatus(newStatus)}
                />;
        }
    }


    render(){

        return(
            <div>
                <div className="modal fade" id="exampleModalCenter" tabIndex="-1" role="dialog"
                     aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title" id="exampleModalLongTitle">Add content</h5>
                                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                {this.renderModalBody()}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => {this.setState(this.getInitialState);}} data-dismiss="modal">Cancel</button>
                                <button type="button" className="btn btn-primary" onClick={() => {this.props.onSave(this.state);}} data-dismiss="modal">Add element</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="adding-button">
                    <button type="button" className="btn btn-danger bmd-btn-fab"
                            data-toggle="modal" data-target="#exampleModalCenter"
                            onClick={() => {this.setState(this.getInitialState);}}
                    >
                        <i className="fas fa-plus material-icons"> </i>
                    </button>
                </div>


            </div>
        );
    }

}

export default Adder
