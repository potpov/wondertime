import React from 'react';
import {Link, Redirect} from 'react-router-dom';

import Adder from "./Editor/Timeline/Adder";
import Deleter from "./Editor/Timeline/Deleter";
import Share from "./Share";
import * as Messages from "./Messages";

import FadeIn from 'react-fade-in';
import Map from "./Map/Map";

class Userspace extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            timelines: null,
            status: 'LOADING',
            redirect_home: false,
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

    followToggle(){
        this.setState({status: 'LOADING' });
        let isFollowing = this.state.isFollowing;
        if(isFollowing !== undefined){
            let headers = {"Content-Type": "application/json"};
            if (this.props.token) {
              headers["Authorization"] = `Token ${this.props.token}`;
            }

            let body = JSON.stringify({
                'action': isFollowing ? 'UNFOLLOW' : 'FOLLOW',
                'target': this.props.match.params.username
            });
            // updating new relationship
            return fetch('/API/user/relationship/toggle', {headers, body, method: "POST"})
            .then(res => res.json())
            .then(this.handleErrors)
            .then(
                (result) => {
                    this.setState({
                        status: 'LOADED',
                        isFollowing: !isFollowing,
                    });
                }
            ).catch((error) => {
                this.setState({
                    status: 'LOADED',
                });
                this.props.raiseError(error);
        });
        }
    }

    downloadTimelines(){
        this.setState({status: 'LOADING' });
        // NOTE: this.props.isAuth is passed by App component
        // after fetch promise is returned.
        let api_uri = "/API/timelines/load/";
        if (!this.props.isAuth || !this.props.token && !this.props.match.params.username) {
            this.setState({status: 'LOADED'});
            return;
        }

        if(this.props.match.params.username)
            api_uri += this.props.match.params.username;

        let headers = {
            "Content-Type": "application/json",
            "Authorization": `Token ${this.props.token}`,
        };

        return fetch(api_uri, {headers})
            .then(res => res.json())
            .then(this.handleErrors)
            .then(
                (result) => {
                    this.setState({
                        status: 'LOADED',
                        timelines: result.timelines,
                        isAdmin: result.is_admin,
                        isFollowing: result.is_following,
                        redirect_home: false,
                    });
                }
            ).catch((error) => {
                this.setState({
                    status: 'LOADED',
                    redirect_home: true
                });
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
                this.props.history.push("/timeline/" + result.hash)
            }
        ).catch((error) => {
            this.props.raiseError(error);
        });
    }

    makePublic(timeline_hash){
        this.setState({status: 'LOADING' });
        let headers = {"Content-Type": "application/json"};
        if (this.props.token) {
          headers["Authorization"] = `Token ${this.props.token}`;
        }
        let body = JSON.stringify({'timeline_hash': timeline_hash});

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

    removeTimeline(timeline_hash){
        this.setState({status: 'LOADING' });
        let headers = {"Content-Type": "application/json"};
        if (this.props.token) {
          headers["Authorization"] = `Token ${this.props.token}`;
        }
        let body = JSON.stringify({'timeline_hash': timeline_hash});

        fetch("/API/timeline/delete", {headers, body, method: "POST"})
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
                        {
                            this.state.isAdmin
                                ?
                                <>
                                    <Share
                                        key={'share_' + timeline.hash}
                                        shortenURL={window.location.origin + '/timeline/' + timeline.hash}
                                        timeline={timeline}
                                        onMakePublic={this.makePublic.bind(this, timeline.hash)}
                                    />
                                    <Deleter
                                        key={'remove_' + timeline.hash}
                                        timeline={timeline}
                                        onClick={this.removeTimeline.bind(this, timeline.hash)}
                                    />
                                </>
                                : null
                        }
                    </div>
                </div>
                </FadeIn>
            </div>
        );
    }

    renderHeader(){
        if(this.state.isAdmin)
            return (
                <div className="jumbotron jumbotron-fluid">
                    <div className="container">
                        <h1 className="display-3">this is your profile</h1>
                        <p className="lead">you can create timelines from the button below</p>
                    </div>
                </div>
            );
        else
            return(
                <div className="jumbotron jumbotron-fluid">
                    <div className="container">
                        <h1 className="display-3">profile of {this.props.match.params.username}</h1>
                        <button
                            type="button"
                            className="btn btn-raised btn-primary"
                            onClick={this.followToggle.bind(this)}>
                            {this.state.isFollowing ? 'unfollow this user' : 'follow this user'}
                        </button>
                    </div>
                </div>
            );
    }

    render(){
        const {timelines, status, redirect_home} = this.state;

        // prevent guests to open this page unless it is from another account
        if (!this.props.isAuth && status !== 'LOADING') {
            this.props.raiseError('you dont have the permissione to access this page');
            return <Redirect to="/login"/>;
        }

        if (redirect_home)
            return <Redirect to="/"/>;

        switch(status){

            case 'LOADED':
                let cards;
                if(Object.keys(timelines).length > 0)
                    cards = timelines.map((timeline) => this.renderCard(timeline));
                else
                    cards = <Messages.Empty/>;

                return(
                    <>
                        { this.renderHeader() }
                        <div className="container-fluid">
                            <div className="row">
                                {cards}
                            </div>
                        </div>
                        {
                            this.state.isAdmin
                                ? <Adder onSave={this.createTimeline.bind(this)}/>
                                : null
                        }
                    </>
                );

            case 'LOADING':
            default:
                return (<Messages.Spinner/>);
        }
    }
}


export default Userspace;
