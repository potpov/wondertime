import React from 'react';

function createObjectURL(object) {
    return (window.URL) ? window.URL.createObjectURL(object) : window.webkitURL.createObjectURL(object);
}

/* following function components help adder class to be more fine-tune */

/* initial window which shows user the editor possible options */
function Switch(props) {
  return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-sm text-center pt-5 pb-5 media_chooser"
                     onClick={() =>props.onClick('picture')}>
                    <i className="fas fa-images"> </i>
                </div>
                <div className="col-sm text-center pt-5 pb-5 media_chooser"
                     onClick={() => props.onClick('video')}>
                    <i className="fas fa-video"> </i>
                </div>
                <div className="col-sm text-center pt-5 pb-5 media_chooser"
                     onClick={() =>props.onClick('caption')}>
                    <i className="fas fa-pen"> </i>
                </div>
            </div>
        </div>
  );
}

/* form section where user can type a place */
function Place(props){

    //creating the hints list from google api results
    let results;
    if (props.hints.length > 1)
       results = props.hints.map(
           (hint, i) =>
                <a className="dropdown-item" key={i} href="#"
                    onClick={(event) => props.onClick(event, hint.hint, hint.key)}>{hint.hint}
                </a>
       );

    return(
        <div className="form-group">
            <label htmlFor="place" className="bmd-label-floating">place of this media</label>
            <div className="dropdown">
                <input
                    type="text" className="form-control"
                    onChange={props.onPlace}
                    id="place"
                    autoComplete="off"
                    data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"
                    value={props.place}
                />

                <div className="dropdown-menu w-100" aria-labelledby="dLabel">
                    {results}
                </div>


            </div>
        </div>
    );
}

/* form section where user can type a caption */
function Caption(props){
    return(
        <div className="form-group">
              <label htmlFor="caption" className="bmd-label-floating">comments about it?</label>
              <input
                  type="text" className="form-control"
                  onChange={props.onCaption}
                  id="caption"
              />
        </div>
    )
}

/* form section where user can upload pictures */
function Picture(props){
    return(
            <>
                <div className="container-fluid">
                    <div className="row">
                        {
                            props.previews
                            ?   props.previews.map((preview, i) =>
                                    <div key={i} className="col-3">
                                        <img src={preview} alt="image-preview" className="img-thumbnail mb-2"/>
                                    </div>
                                )
                            :   null
                        }
                    </div>
                </div>
                <input type="file" className="selectedFiles" id="picture_picker" name="pic" onChange={props.onPicture} multiple accept="image/*" />
                <button type="button" className="mb-0 btn btn-raised btn-secondary w-100 p-2"
                        onClick={() => document.getElementById("picture_picker").click()}
                >
                    upload pictures
                </button>
            </>
        );
}

/* form section where user can upload a video */
function Video(props){
    return(
        <>
            {
                props.message
                ? <span>{props.message}</span>
                : null
            }
            <input type="file" className="selectedFiles" id="video_picker" name="pic" onChange={props.onVideo} accept="video/*" />
            <button type="button" className="mb-0 btn btn-raised btn-secondary w-100 p-2"
                    onClick={() => document.getElementById("video_picker").click()}
            >
                upload video
            </button>
        </>
    )
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
            place_id: '',
            message: '',
            hints: ''
        };
    }


    constructor(props) {
        super(props);
        this.state = this.getInitialState();
    }

    /* ask google for places and coords while user is typing */
    loadHints(place){
        if(place.length < 3)
            return;

        let headers = {
            "Content-Type": "application/json",
        };

        return fetch(`/API/place/search/${place}`, {headers, })
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({
                        hints: result,
                    });
                }
            )
    }

    setPlace(e, place, place_id){
        this.setState({
            place: place,
            place_id: place_id,
        });
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
        this.setState({place: e.target.value});
        this.loadHints(e.target.value);
    }

    loadCaption(e){
        this.setState({caption: e.target.value})
    }

    /* status loader */

    changeStatus(newStatus){
        this.setState({status: newStatus})
    }

    renderModalBody(){
        // initial form
        if(! this.state.status || this.state.status === 'init')
            return <Switch onClick={this.changeStatus.bind(this)} />;
        // base form + video | picture chooser
        return(
            <>
                <Place
                    onPlace={(e) => this.loadPlace(e)}
                    onClick={this.setPlace.bind(this)}
                    hints={this.state.hints}
                    place={this.state.place}
                />
                <Caption
                    onCaption={(e) => this.loadCaption(e)}
                />
                {(() => {
                    switch(this.state.status) {
                      case 'picture':
                        return (
                            <Picture
                                onPicture={this.loadPic.bind(this)}
                                previews={this.state.src}
                            />
                        );
                      case 'video':
                        return (
                            <Video
                                onVideo={this.loadVideo.bind(this)}
                                message={this.state.message}
                            />
                        );
                      case 'caption':
                      default:
                        return null;
                    }})()
                }
            </>
        );
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

                <button type="button" className="editor-button adder btn btn-danger bmd-btn-fab "
                        data-toggle="modal" data-target="#exampleModalCenter"
                        onClick={() => {this.setState(this.getInitialState);}}
                >
                    <i className="fas fa-plus material-icons"> </i>
                </button>



            </div>
        );
    }

}

export default Adder
