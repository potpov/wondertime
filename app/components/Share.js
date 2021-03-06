import React from 'react';
import {CopyToClipboard} from 'react-copy-to-clipboard';

class Share extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            type: 'init',
            caption: 'check it out the full story at: ' + this.props.shortenURL,
            copied: false,
        }
    }


    loadCaption(e){
        this.setState({caption: e.target.value})
    }

    renderModalBody(){

        if(!this.props.timeline.isPublic){
            return (
                <div>
                    <div className="modal-body">
                            it looks like this timeline is not public yet.
                            do you want to make it public?
                        </div>
                    <button type="button" className="btn btn-secondary" data-dismiss="modal">Cancel</button>
                    <button type="button" className="btn btn-primary" onClick={() => {this.props.onMakePublic()}} data-dismiss="modal">publish
                    </button>
                </div>
            );
        }

        // a switch left here if you want to share content in other ways
        // just re-use the modal-body in the way you prefer.
        switch (this.state.type) {
            case 'link':
                return (
                    <div>
                        <div className="modal-body">
                            <div className="alert alert-dark" role="alert">
                                {this.props.shortenURL} {this.state.copied ? '[copied]' : ''}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
                            <CopyToClipboard text={this.props.shortenURL}
                                onCopy={() => this.setState({copied: true})}>
                                <button type="button" className="btn btn-primary">Copy to clipboard</button>
                            </CopyToClipboard>
                        </div>
                    </div>

                );
            case 'init':
            default:
                return <p>something wrong here</p>;
        }
    }


    render(){
        return(
            <>

                <div className="modal fade" id={'shareconfirm-'+ this.props.timeline.hash} tabIndex="-1" role="dialog"
                     aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title" id={'#shareconfirm-'+ this.props.timeline.hash}>share with your friends</h5>
                                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            {this.renderModalBody()}
                        </div>
                    </div>
                </div>

                <button className='
                    btn btn-outline-info link-share w-100 mb-1'
                    data-toggle="modal" data-target={'#shareconfirm-'+this.props.timeline.hash}
                    onClick={() => {this.setState({type: 'link'});}}
                    >
                    get the link <i className="fas fa-share-square"> </i>
                </button>

            </>
        );
    }

}

export default Share
