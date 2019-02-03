import React from 'react';
import PropTypes from 'prop-types';
import Caption from "./Caption"

class Video extends React.Component {

    Editor(){
        if(this.props.editor)
            return this.props.children;
    }

    //it can happen to get an array of a single link, let's handle this
    urlRender(){
        if(typeof this.props.url === 'object')
            return this.props.url[Object.keys(this.props.url)[0]];
        else
            return this.props.url;
    }

    render(){
        return(
            <div className="card mt-5 w-50 mx-auto">
                {this.Editor()}
                <video width="100%" height="100%" controls>
                  <source src={this.urlRender()} type="video/mp4"/>
                </video>
                <Caption caption={this.props.caption} />
            </div>
        );
    }
}

Video.propTypes = {
    url: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.array
    ]).isRequired,
    caption: PropTypes.string,
};

export default Video
