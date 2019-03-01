import React from 'react';
import PropTypes from 'prop-types';

class Caption extends React.Component {

    Editor(){
        if(this.props.editor)
            return this.props.children;
    }

    render() {
        if(this.props.caption == null || this.props.caption === '')
            return <div>{null}</div>;

        if(this.props.includeHeader)
            return this.renderHeader();
        else
            return this.renderBody();
    }

    renderHeader(){
        return(
            <div id={this.props.card_focus}
                 className={"card  mt-5 w-50 mx-auto " + (this.props.editor ? 'admin' : '')}>
                {this.Editor()}
                {this.renderBody()}
            </div>
        );
    }

    renderBody() {
        return(
            <div className="card-body">
                    <p className="card-text">{this.props.caption}</p>
            </div>
        );
    }
}

Caption.defaultProps = {
    includeHeader: false,
};

Caption.propTypes = {
    caption: PropTypes.string,
    includeHeader: PropTypes.bool,
};

export default Caption
