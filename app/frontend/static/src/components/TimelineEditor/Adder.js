import React from 'react';


function createObjectURL(object) {
    return (window.URL) ? window.URL.createObjectURL(object) : window.webkitURL.createObjectURL(object);
}



class Adder extends React.Component {


    getInitialState() {
        return {
            title: null,
            cover: null, // real binary file
            localURL: null, // just a blob for the user preview
            message: null,
        };
    }


    constructor(props) {
        super(props);
        this.state = this.getInitialState();
    }


    /* picture loader */

    loadCover(e){
        if(e.target.files.length !== 1) {
            this.setState({message: 'please set one picture.'})
            return;
        }
        let data = e.target.files[Object.keys(e.target.files)[0]];
        let src = createObjectURL(data);
        this.setState({
            cover: data,
            localURL: src,
        })
    }

    /* title loaders */

    loadTitle(e){
        this.setState({title: e.target.value})
    }


    preview(){
        if(this.state.localURL)
            return <img src={this.state.localURL} alt="image-preview" className="img-thumbnail mb-2"/>;
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
                                <div>
                                    <div className="form-group">
                                          <label htmlFor="title" className="bmd-label-floating">set a timeline title</label>
                                          <input
                                              type="text" className="form-control"
                                              onChange={(e) => this.loadTitle(e)}
                                              id="title"
                                          />
                                    </div>
                                    {this.preview()}
                                    <input type="file" className="selectedFiles" ref="picker" name="pic" onChange={(e) => this.loadCover(e)} multiple accept="image/*" />
                                    <button type="button" className="mb-0 btn btn-raised btn-secondary w-100 p-2"
                                            onClick={() => this.refs.picker.click()}
                                    >
                                        upload cover
                                    </button>

                                </div>
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
