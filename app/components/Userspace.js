import React from 'react';
import {Link, Redirect} from 'react-router-dom';

import Adder from "./Editor/Timeline/Adder";
import Share from "./Share";
import * as Messages from "./Messages";

import FadeIn from 'react-fade-in';
import Map from "./Map/Map";

class Userspace extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            timelines: null,
        };
    }

    componentDidMount() {
        this.downloadTimelines();
    }

    handleErrors(result) {
        if(result.error)
            throw result.error;
        return result;
    }

    downloadTimelines(){

        if (!this.props.isAuth || !this.props.token) {
            return;
        }

        this.setState({status: 'LOADING' });
        let headers = {
            "Content-Type": "application/json",
            "Authorization": `Token ${this.props.token}`,
        };

        return fetch("/API/timelines/load", {headers, })
            .then(res => res.json())
            .then(this.handleErrors)
            .then(
                (result) => {
                    this.setState({
                        status: 'LOADED',
                        timelines: result,
                    });
                }
            ).catch((error) => {
                this.setState({status: 'LOADED'});
                this.props.raiseError(error);
        });

    }

    createTimeline(timeline){
        if(timeline.title == null){
            this.props.raiseError('select title for a new timeline');
            return;
        }

        let headers = {
            "Content-Type": "application/json",
            "Authorization": `Token ${this.props.token}`,
        };
        let body = JSON.stringify({title: timeline.title});
        fetch("/API/timeline/create", {
            headers,
            body,
            method: "POST"
        })
        .then(response => response.json())
        .then(this.handleErrors)
        .then(
            (result) => {
                this.props.raiseMessage(result.message)
            }
        ).catch((error) => {
            this.props.raiseError(error);
        });
        setTimeout( () => {this.downloadTimelines();}, 1000);
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
            .then(this.handleErrors)
            .then(
                (result) => {
                    this.props.raiseMessage(result.message);
                    // refresh
                    setTimeout( () => {this.downloadTimelines();}, 1000);
                }
            ).catch((error) => {
                this.props.raiseError(error);
        });
    }

    renderCard(timeline) {
        return (
            <div key={timeline.hash} className="mt-4 col-sm-6 col-md-4 col-lg-3">
                <FadeIn>
                <div className="card">
                    <Map
                        coords={timeline.positions}
                        timeline_hash={timeline.hash}
                    />
                    <div className="card-body">
                        <h5 className="card-title">{timeline.title}</h5>
                        <p className="card-text">created on {timeline.creation_date}</p>
                        <p className="font-italic">{timeline.isPublic ? 'public' : 'private: only you can watch this'}</p>
                        <Link to={'/timeline/' + timeline.hash} className="btn btn-outline-info w-100 mb-1">VIEW</Link>
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
        const {timelines, status} = this.state;

        // check is user has permissions for this page
        if (!this.props.isAuth && status !== 'LOADING')
            return <Redirect to="/login"/>;

        switch(status){

            case 'LOADED':
                let cards;
                if(Object.keys(timelines).length > 0)
                    cards = timelines.map((timeline) => this.renderCard(timeline));
                else
                    cards = <Messages.Empty/>;

                return(
                    <>
                        <div className="container-fluid">
                            <div className="row">
                                {cards}
                            </div>
                        </div>
                        <Adder onSave={this.createTimeline.bind(this)}/>
                    </>
                );

            case 'LOADING':
            default:
                return (<Messages.Spinner/>);
        }
    }
}


export default Userspace;
