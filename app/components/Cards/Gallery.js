import React from 'react';
import Caption from "./Caption"
import PropTypes from 'prop-types';

class Gallery extends React.Component {

    Editor(){
        if(this.props.editor)
            return this.props.children;
    }

    Carousel(){
        return this.props.urls.map((url, index) => {
                let cls = (index === 0) ? 'carousel-item active ' : 'carousel-item ';
                return (
                    <div id={this.props.card_focus} key={index} className={cls}>
                        <img className="d-block w-100" src={url} alt="First slide"/>
                    </div>
                );
            }
        );
    }

    render(){
        return(
            <div className="card mt-5 w-50 mx-auto">
                {this.Editor()}
                <div id={this.props.sequence}
                     className={"carousel slide w-100 " + (this.props.editor ? 'admin' : '')}
                     data-ride="carousel">
                    <div className="carousel-inner">
                        {this.Carousel()}
                    </div>

                    <a className="carousel-control-prev" href={"#"+this.props.sequence} role="button" data-slide="prev">
                        <span className="carousel-control-prev-icon" aria-hidden="true"> </span>
                        <span className="sr-only">Previous</span>
                    </a>
                    <a className="carousel-control-next" href={"#"+this.props.sequence} role="button" data-slide="next">
                        <span className="carousel-control-next-icon" aria-hidden="true"> </span>
                        <span className="sr-only">Next</span>
                    </a>
                </div>
                <Caption caption={this.props.caption}/>
            </div>

        );
    }
}

Gallery.propTypes = {
    urls: PropTypes.array.isRequired,
    caption: PropTypes.string,
    sequence: PropTypes.number.isRequired,

};

export default Gallery
