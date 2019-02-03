import React from 'react';

class PictureChooser extends React.Component {

    thumbnail(){
        if(this.props.previews)
            return this.props.previews.map((preview, i) =>
                <div key={i} className="col-3">
                    <img src={preview} alt="image-preview" className="img-thumbnail mb-2"/>
                </div>
            );
    }

    render(){
        return(
            <div>
                <div className="form-group">
                      <label htmlFor="place" className="bmd-label-floating">where did you take this?</label>
                      <input
                          type="text" className="form-control"
                          onChange={this.props.onPlace}
                          id="place"
                          defaultValue={this.props.placehit}
                          ref={input => this.inputField = input}
                          onFocus = {() => this.inputField.value = ""}
                      />
                </div>
                <div className="form-group">
                      <label htmlFor="caption" className="bmd-label-floating">comments about it?</label>
                      <input
                          type="text" className="form-control"
                          onChange={this.props.onCaption}
                          id="caption"
                      />
                </div>
                <div className="container-fluid">
                    <div className="row">
                        {this.thumbnail()}
                    </div>
                </div>
                <input type="file" className="selectedFiles" ref="picker" name="pic" onChange={this.props.onPicture} multiple accept="image/*" />
                <button type="button" className="mb-0 btn btn-raised btn-secondary w-100 p-2"
                        onClick={() => this.refs.picker.click()}
                >
                    upload pictures
                </button>

            </div>
        );
    }
}

export default PictureChooser