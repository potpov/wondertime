import React from 'react';

import {connect} from "react-redux";

import * as Editor from "./CardEditor"
import * as Cards from "./Types"
import * as Messages from "./Messages"

import Navbar from "./Navbar"
import css from "../css/timeline.css";

import FadeIn from 'react-fade-in';

/* this timeline handle timelines previews and editors */
class Timeline extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            status: 'LOADING',
            errors: null,
            messages: null,
            isAdmin: false, // should we load the editor part of the timeline?
            placehit: '', // avoid editors to type a new place is it's te same of the previous one added
            nextSeq: 0,
            items: [], // list of current items without files
            toBeRemoved: [], // sequence number of files to be removed
            mediasource: [] // files linked to the items with an unique hash
        };
    }

    resetMessages(){
        this.setState({
            messages: null,
            errors: null,
        });
    }

    componentDidMount() {
        this.downloadTimeline();
    }

    downloadTimeline(){
        let headers = {
          "Content-Type": "application/json",
        };

        if (this.props.token) {
          headers["Authorization"] = `Token ${this.props.token}`;
        }
        fetch('/API/timeline/load/' + this.props.match.params.id, {headers, })
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({
                        status: 'LOADED',
                        items: result.media,
                        nextSeq: result.nextSeq,
                        isAdmin: result.admin,
                        messages: result.message
                    });
                },
                (error) => {
                    this.setState({
                        status: 'ERROR',
                        errors: error
                    });
                }
            );
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
                console.log("error, unknown type/status");
                return;
        }
        //saving data
        items.push({
                sequence: nextSeq,
                type: item.status,
                source: source, // link to real file stored in mediasource!
                url: localurl, // just a blob for the user.
                caption: item.caption,
                long: 10,
                lat: 10,
                new: true,
        });
        nextSeq++;
        this.setState({
            placehit: item.place, // recording the last place for suggesting
            items: items,
            nextSeq: nextSeq,
            mediasource: mediasource,
        });
    }

    uploadFiles(){
        //cloning the item tree by keeping only the new items
        let itemstree = [];
        this.state.items.forEach(function(item){
            if(item.new)
                itemstree.push(item);
        });

        fetch("/API/blob/action/update")
            .then(res => res.json())
            .then(
                (blobURL) => {
                    var request = new XMLHttpRequest();
                    var formdata = new FormData();
                    formdata.append('to_be_removed', JSON.stringify(this.state.toBeRemoved));
                    formdata.append('items_tree', JSON.stringify(itemstree)); // without source files
                    formdata.append('timeline_hash', this.props.match.params.id);
                    // append a custom field foreach new file
                    this.state.mediasource.forEach(function (file) {
                        formdata.append(file.digest, file.file);
                    });

                    request.open('POST', blobURL.url);
                    request.setRequestHeader("Authorization", "Token " + this.props.token);
                    // Send our FormData object; HTTP headers are set automatically
                    request.send(formdata);

                    // Define what happens on response
                    request.onload = function (e) {
                        if (request.readyState === 4) {
                            if (request.status === 200) {
                                let json_obj = JSON.parse(request.responseText);
                                this.setState({messages: json_obj['message'], errors: json_obj['error']});
                            }
                            else {
                                console.error(request.statusText);
                            }
                        }
                    }.bind(this);
                    //refresh timelines
                    setTimeout( () => {this.downloadTimeline();}, 1500);
                }, //handling errors if blob entry creation fails
                (error) => {
                    this.setState({
                        errors: error
                    });
                }
            );
    }

    componentFactory(data, index, editor=false) {
        switch (data.type) {
            case 'video':
                return <Cards.Video
                    key={data.sequence}
                    url={data.url}
                    caption={data.caption}
                    editor={editor}>
                    <Editor.Deleter onDelete={this.removeItem.bind(this, index, data.sequence)}/>
                </Cards.Video>;
            case 'picture':
                return <Cards.Picture
                    key={data.sequence}
                    url={data.url}
                    caption={data.caption}
                    editor={editor}>
                     <Editor.Deleter onDelete={this.removeItem.bind(this, index, data.sequence)}/>
                </Cards.Picture>;
            case 'gallery':
                return <Cards.Gallery
                    key={data.sequence}
                    urls={data.url}
                    sequence={data.sequence}
                    caption={data.caption}
                    editor={editor}>
                    <Editor.Deleter onDelete={this.removeItem.bind(this, index, data.sequence)}/>
                </Cards.Gallery>;
            case 'caption':
                return <Cards.Caption
                    key={data.sequence}
                    includeHeader
                    caption={data.caption}
                    editor={editor}>
                    <Editor.Deleter onDelete={this.removeItem.bind(this, index, data.sequence)}/>
                </Cards.Caption>;
            default:
                return undefined;
        }
    }

    renderAdderEditor() {
        if (this.state.isAdmin)
            return <Editor.Adder onSave={this.addItem.bind(this)} placehit={this.state.placehit}/>;
    }

    renderSaverEditor(){
        if (this.state.isAdmin)
            return <Editor.Saver onClick={this.uploadFiles.bind(this)}/>;
    }

    renderTimeline(){
        if(this.state.items.length > 0) {
            let timeline = this.state.items.map((media, index) => this.componentFactory(media, index, this.state.isAdmin));
            return(
                <div>
                    {timeline}
                    {this.renderSaverEditor()}
                </div>
            );
        }
        else
            return <Messages.Empty/>;
    }

    render() {
        const {errors, messages, items, isAdmin, status} = this.state;

        switch(status){
            case 'LOADING':
                return (
                    <div>
                        <Navbar homepage/>
                        <Messages.Spinner/>
                    </div>
                );
            case 'LOADED':
                return (
                    <div>
                        <Navbar homepage/>
                        <Messages.Banner messages={messages} errors={errors} onReset={this.resetMessages.bind(this)}/>
                        <FadeIn>
                            <div className="container mb-5 timeline">
                                {this.renderTimeline()}
                            </div>
                        </FadeIn>
                        {this.renderAdderEditor()}
                    </div>
                );
            case 'ERROR':
            default:
                return (
                    <div>
                        <Navbar homepage/>
                        <Messages.Banner messages={messages} errors={errors} onReset={this.resetMessages.bind(this)}/>
                    </div>);
        }
    }

}

const mapStateToProps = state => {
  return {
    token: state.auth.token,
  };
};


export default connect(mapStateToProps, null)(Timeline);