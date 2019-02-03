import React from 'react';
import {Link} from 'react-router-dom';

import connect from "react-redux/es/connect/connect";
import Navbar from "./Navbar";
import Adder from "./TimelineEditor/Adder";
import Share from "./Share";
import * as Messages from "./Messages";

import FadeIn from 'react-fade-in';

class Userspace extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            status: 'LOADING',
            errors: this.props.errors,
            messages: this.props.messages,
            timelines: null,
        };
    }

    resetMessages(){
        this.setState({
            messages: null,
            errors: null,
        });
    }

    componentDidMount() {
        this.downloadTimelines();
    }

    downloadTimelines(){
        this.setState({status: 'LOADING' });
        let headers = {"Content-Type": "application/json"};
        if (this.props.token) {
          headers["Authorization"] = `Token ${this.props.token}`;
        }

        fetch("/API/timelines/load", {headers, })
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({
                        status: 'LOADED',
                        timelines: result
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

    createTimeline(timeline){
        if(timeline.title == null || timeline.cover == null){
            this.setState({errors: 'missing parameters'});
            return;
        }

        fetch("/API/blob/action/create")
            .then(res => res.json())
            .then(
                (blobURL) => {
                    var request = new XMLHttpRequest();
                    var formdata  = new FormData();
                    formdata.append('title', timeline.title);
                    formdata.append('cover', timeline.cover);
                    request.open('POST', blobURL.url);
                    request.setRequestHeader("Authorization", "Token " + this.props.token);
                    request.send(formdata);
                    //creating a function to display message to user
                    request.onload = function (e) {
                        if (request.readyState === 4) {
                            if (request.status === 200) {
                                let json_obj = JSON.parse(request.responseText);
                                this.setState({messages: json_obj['message'], errors: json_obj['error']});
                            }
                        }
                    }.bind(this);
                    //refresh timelines
                    setTimeout( () => {this.downloadTimelines();}, 1000);
                //error: blob not created
                },
                (error) => {
                    this.setState({
                        errors: error
                    });
                }
            );
    }

    instaShare(cover, caption){

    }

    makePublic(timeline){
        this.setState({status: 'LOADING' });
        let headers = {"Content-Type": "application/json"};
        if (this.props.token) {
          headers["Authorization"] = `Token ${this.props.token}`;
        }
        let body = JSON.stringify({'timeline_hash': timeline.hash});

        fetch("/API/timeline/publish", {headers, body, method: "POST"})
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({
                        //not going to set status loaded because we will refresh the page soon
                        messages: result.success
                    });
                    //refresh
                    setTimeout( () => {this.downloadTimelines();}, 1000);
                },
                (error) => {
                    this.setState({
                        status: 'ERROR',
                        errors: error
                    });
                }
            );
    }

    renderCard(timeline) {
        return (
            <div key={timeline.hash} className="mt-4 col-sm-6 col-md-4 col-lg-3">

                <FadeIn>
                <div className="card">
                    <img className="card-img-top" src={timeline.cover_url} alt="Card image cap"/>
                    <div className="card-body">
                        <h5 className="card-title">{timeline.title}</h5>
                        <p className="card-text">created on {timeline.creation_date}</p>
                        <p className="font-italic">{timeline.isPublic ? 'public' : 'private: only you can watch this'}</p>
                        <Link to={'/timeline/' + timeline.hash} className="btn btn-outline-info w-100 mb-1">EDITOR</Link>
                        <Share
                            key={timeline.hash}
                            shortenURL={'www.shorten/' + timeline.hash}
                            timeline={timeline}
                            onMakePublic={this.makePublic.bind(this, timeline)}
                            onInsta={this.instaShare.bind(this)}
                        />
                    </div>
                </div>
                </FadeIn>
            </div>
        );
    }

    render(){
        const {errors, messages, timelines, status} = this.state;
        switch(status){
            case 'LOADING':
                return (
                    <div>
                        <Messages.Spinner/>
                    </div>
                );

            case 'LOADED':
                let cards;
                if(Object.keys(timelines).length > 0)
                    cards = timelines.map((timeline) => this.renderCard(timeline));
                else
                    cards = <Messages.Empty/>;

                return(
                <div>
                    <Navbar homepage/>
                    <div className="container-fluid">
                        <div className="row">
                            {cards}
                        </div>
                    </div>
                    <Messages.Banner messages={messages} errors={errors} onReset={this.resetMessages.bind(this)}/>
                    <Adder onSave={this.createTimeline.bind(this)}/>
                </div>
                );

            case 'ERROR':
            default:
                return <div>error: {errors}</div>;
        }
    }
}

const mapStateToProps = state => {
  return {
    token: state.auth.token,
  };
};


export default connect(mapStateToProps, null)(Userspace);
