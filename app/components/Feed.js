import React from 'react';
import {Link, Redirect} from 'react-router-dom';

import * as Messages from "./Messages";

import FadeIn from 'react-fade-in';
import Map from "./Map/Map";

class Feed extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            timelines: null,
            status: 'LOADING',
            redirect_home: false,
        };
    }

    componentDidMount() {
        this.downloadFeed();
    }

    handleErrors(result) {
        if(result.error)
            throw result.error;
        return result;
    }

    downloadFeed(){
        this.setState({status: 'LOADING' });
        // NOTE: this.props.isAuth is passed by App component
        // after fetch promise is returned.
        if (!this.props.isAuth || !this.props.token) {
            this.setState({status: 'LOADED'});
            return;
        }

        let headers = {
            "Content-Type": "application/json",
            "Authorization": `Token ${this.props.token}`,
        };

        return fetch('/API/user/relationship/feed', {headers})
            .then(res => res.json())
            .then(this.handleErrors)
            .then(
                (result) => {
                    this.setState({
                        status: 'LOADED',
                        timelines: result,
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
                        <p className="font-italic">by
                           <Link to={'/experiences/' + timeline.creator}> {timeline.creator}</Link>
                        </p>
                        <Link to={'/timeline/' + timeline.hash} className="btn btn-outline-info w-100 mb-1">VIEW</Link>
                    </div>
                </div>
                </FadeIn>
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
                        <div className="jumbotron jumbotron-fluid">
                            <div className="container">
                                <h1 className="display-3">here's your news feed</h1>
                                <p className="lead">follow people to see their fresh content in here</p>
                            </div>
                        </div>
                        <div className="container-fluid">
                            <div className="row">
                                {cards}
                            </div>
                        </div>
                    </>
                );

            case 'LOADING':
            default:
                return (<Messages.Spinner/>);
        }
    }
}


export default Feed;
