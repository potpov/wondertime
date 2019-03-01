import React from 'react';

import * as Editor from "./Editor/Card"
import * as Cards from "./Cards"
import * as Messages from "./Messages"

import FadeIn from 'react-fade-in';
import Sortable from 'react-drag-sort';

/* this timeline handle timelines previews and editors */
class Timeline extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            status: 'LOADING',
            isAdmin: false, // should we load the editor part of the timeline?
            prev_place_id: '', // card place is not changed? -> previous id value
            prev_place_name: '', // card place is not changed? -> previous name value
            nextSeq: 0,
            items: [], // list of current items without files
            toBeRemoved: [], // sequence number of files to be removed
            mediasource: [], // files linked to the items with an unique hash
        };
    }

    componentDidMount() {
        this.downloadTimeline();
    }

    handleErrors(result) {
        if(result.error)
            throw result.error;
        return result;
    }

    downloadTimeline(){
        this.setState({status: 'LOADING'});
        let headers = {
          "Content-Type": "application/json",
        };

        if (this.props.token) {
          headers["Authorization"] = `Token ${this.props.token}`;
        }
        fetch('/API/timeline/load/' + this.props.match.params.id, {headers, })
            .then(response => response.json())
            .then(this.handleErrors)
            .then(
                (result) => {
                    this.setState({
                        status: 'LOADED',
                        items: result.media,
                        nextSeq: result.nextSeq,
                        isAdmin: result.admin,
                    });
                    if(this.props.match.params.marker)
                        document.getElementById(this.props.match.params.marker).scrollIntoView();
                }
            ).catch((error) => {
                this.props.raiseError(error);
        });
        this.setState({status: 'LOADED'});
    }

    removeItem(i, seqNumber){
        const items = this.state.items.slice();
        const mediasource = this.state.mediasource.slice();
        const toBeRemoved = this.state.toBeRemoved;
        //if it is a new item just remove all the source from the mediasource to avoid unuseful uploads
        if(items[i].new) {
            if(items[i].type !== 'caption') { // captions have no sources attached!
                items[i].source.forEach(function (link) {
                    mediasource.splice(link, 1);
                })
            }
        }
        //if it has to be deleted from the server let's notice it
        else {
           toBeRemoved.push(seqNumber); //this is an unique id for the element on the server
        }
        //finally we remove the element from the render list
        items.splice(i, 1);
        this.setState({items: items, toBeRemoved: toBeRemoved, mediasource: mediasource})
    }

    addItem(item){
        if(!item.place_id) {
            this.props.raiseError('please select a place from the suggestions!');
            return;
        }
        let {items, nextSeq, mediasource} = this.state;
        // variables according to the item status/type
        let localurl;
        let source = [];

        switch (item.status) {
            case 'picture':
                item.file.length > 1 ? item.status = 'gallery' : item.status = 'picture';
                // creating a link foreach file, storing the file in a custom structure
                item.file.forEach(function(file){
                    let digest = '_' + Math.random().toString(36).substr(2, 9);
                    source.push(digest);
                    mediasource.push({
                        tmp_item_ref: nextSeq,
                        digest: digest,
                        file: file,
                    });
                });
                localurl = item.src; // just a blob for the user experience.
                break;
            case 'caption':
                source = null;
                localurl = null;
                break;
            case 'video':
                let digest = '_' + Math.random().toString(36).substr(2, 9);
                source.push(digest);
                mediasource.push({
                        digest: digest,
                        file: item.file,
                    });
                localurl = item.src; // just a blob for the user.
                break;
            default:
                this.props.raiseError('unknown type/status');
                return;
        }
        //saving data
        items.push({
                key: nextSeq,
                value: {
                    sequence: nextSeq,
                    type: item.status,
                    source: source, // link to real file stored in mediasource!
                    url: localurl, // just a blob for the user.
                    caption: item.caption,
                    place_name: item.place,
                    place_id: item.place_id,
                    new: true,
                }
        });
        nextSeq++;
        this.setState({
            items: items,
            nextSeq: nextSeq,
            mediasource: mediasource,
            prev_place_id: item.place_id,
            prev_place_name: item.place,
        });
    }

    uploadFiles(){
        this.setState({ status: 'LOADING'});

        /*
            cloning the item tree
            if item is new we clone everything of it
            if item is not new we just clone id and key
            (APIs will use ID to identify items
            to delete and item which position needs to
            be updated
        */
        let old_items = {};
        let new_items = [];
        let item_ref_list = [];
        this.state.items.forEach(function(item, newkey){
            item_ref_list.push(item.key); // saving this key to filter unuseful media before sending
            if(item.value.new) {
                item.value.sequence = newkey;
                new_items.push(item.value);
            }
            else
                old_items[item.value.hash] = newkey
        });

        fetch("/API/blob/action/update")
            .then(res => res.json())
            .then(
                (blobURL) => {
                    var request = new XMLHttpRequest();
                    var formdata = new FormData();
                    formdata.append('old_items', JSON.stringify(old_items)); // without source files
                    formdata.append('new_items', JSON.stringify(new_items)); // without source files
                    formdata.append('timeline_hash', this.props.match.params.id);
                    /*
                        suppose the user adds an item with attached media
                        and then remove it from the editor.
                        media will remain in mediasource and will be sent
                        to the server at every upload request.
                        upload only media linked to active items
                        and clean the mediasource variable at the end
                     */
                    this.state.mediasource.forEach(function (file) {
                        if(file.tmp_item_ref in item_ref_list)
                            formdata.append(file.digest, file.file);
                    });
                    this.setState({
                        mediasource: [],
                    });
                    
                    request.open('POST', blobURL.url);
                    request.setRequestHeader("Authorization", "Token " + this.props.token);
                    // Send our FormData object; HTTP headers are set automatically
                    request.send(formdata);
                    // show logs on response
                    request.onload = ((e) => {
                        if (request.readyState === 4) {
                            if (request.status === 200) {
                                let json_obj = JSON.parse(request.responseText);
                                if(json_obj['message'])
                                    this.props.raiseMessage(json_obj['message']);
                                else if(json_obj['error'])
                                    this.props.raiseError(json_obj['error']);
                                //refresh timelines
                                this.downloadTimeline();
                            }
                            else {
                                this.props.raiseError(request.statusText);
                            }
                        }
                        this.setState({ status: 'LOADED'});
                    })
                }
            );
    }

    // value is the component info in item
    // index is the key = sequence of the item
    Item ({value, index, onRemove, decorateHandle}) {
        let editor = true;
        switch (value.type) {
            case 'video':
                return decorateHandle(
                    <div>
                        <Cards.Video
                            key={value.sequence}
                            url={value.url}
                            caption={value.caption}
                            editor={editor}>
                            <Editor.Deleter onDelete={onRemove}/>
                        </Cards.Video>
                    </div>
                );
            case 'picture':
                return decorateHandle(
                    <div>
                        <Cards.Picture
                            key={value.sequence}
                            url={value.url}
                            caption={value.caption}
                            editor={editor}>
                             <Editor.Deleter onDelete={onRemove}/>
                        </Cards.Picture>
                    </div>
                );
            case 'gallery':
                return decorateHandle(
                    <div>
                        <Cards.Gallery
                            key={value.sequence}
                            urls={value.url}
                            sequence={value.sequence}
                            caption={value.caption}
                            editor={editor}>
                            <Editor.Deleter onDelete={onRemove}/>
                        </Cards.Gallery>
                    </div>
                );
            case 'caption':
                return decorateHandle(
                    <div>
                        <Cards.Caption
                            key={value.sequence}
                            includeHeader
                            caption={value.caption}
                            editor={editor}>
                            <Editor.Deleter onDelete={onRemove}/>
                        </Cards.Caption>
                    </div>
                );
            default:
                return undefined;
        }
    }

    render() {
        const {status} = this.state;
        switch(status){
            case 'LOADING':
                return (<Messages.Spinner/>);
            case 'LOADED':

                return (
                    <FadeIn>
                        {this.state.items.length > 0 ?
                            <div className="container mb-5 timeline">
                                <Sortable
                                    collection={this.state.items}
                                    onChange={items => {
                                        this.setState({items})
                                    }}
                                    Component={this.Item}
                                />
                            </div>
                            : <Messages.Empty/>
                        }

                        {
                            this.state.isAdmin
                            ?
                                <>
                                    <Editor.Adder
                                        onSave={this.addItem.bind(this)}
                                        prev_place_id={this.state.prev_place_id}
                                        prev_place_name={this.state.prev_place_name}
                                        raiseError={this.props.raiseError}
                                    />
                                    <Editor.Saver onClick={this.uploadFiles.bind(this)}/>
                                </>
                            : null
                        }
                    </FadeIn>
                );
        }
    }

}


export default Timeline;