import React from 'react';

class VideoChooser extends React.Component {

    thumbnail(){
        if(this.props.message !== '')
            return <span>{this.props.message}</span>
    }

    render(){
        return(
            <div>
                <div className="form-group">
                      <label htmlFor="place" className="bmd-label-floating">where did you take this video?</label>
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
                {this.thumbnail()}
                <input type="file" className="selectedFiles" ref="picker" name="pic" onChange={this.props.onVideo} accept="video/*" />
                <button type="button" className="mb-0 btn btn-raised btn-secondary w-100 p-2"
                        onClick={() => this.refs.picker.click()}
                >
                    upload video
                </button>

            </div>
        );
    }
}

export default VideoChooser