import React from 'react';
import Caption from "./Caption"
import PropTypes from 'prop-types';

class Picture extends React.Component {

    Editor(){
        if(this.props.editor)
            return this.props.children;
    }

    urlRender(){
        if(typeof this.props.url === 'object')
            return this.props.url[Object.keys(this.props.url)[0]];
        else
            return this.props.url;
    }

    render(){
        return(
            <div id={this.props.card_focus}
                 className={"card  mt-5 w-50 mx-auto " + (this.props.editor ? 'admin' : '')}>
                {this.Editor()}
                <img className="card-img-top" src={this.urlRender()}
                     alt="Card image cap"/>
                <Caption caption={this.props.caption} />
            </div>
        );
    }
}

Picture.propTypes = {
    url: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.array
    ]).isRequired,
    caption: PropTypes.string,
};

export default Picture
