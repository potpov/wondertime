import React from 'react';

class CaptionChooser extends React.Component {

    render(){
         return(
             <div>
                <div className="form-group">
                      <label htmlFor="place" className="bmd-label-floating">where did you think it?</label>
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
                      <label htmlFor="caption" className="bmd-label-floating">what's your though?</label>
                      <input
                          type="text" className="form-control"
                          onChange={this.props.onCaption}
                          id="caption"
                      />
                </div>
             </div>
         );
    }

}

export default CaptionChooser;