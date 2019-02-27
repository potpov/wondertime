/* form section where user can type a place */
import React from "react";
import {Link, withRouter} from "react-router-dom";

class Form extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            text: '',
            maps_hints: [],
            user_hints: [],
        };
        this.routeChange = this.routeChange.bind(this);
    }

    loadMapsHints(search_text){
        if(search_text.length < 3)
            return;

        let headers = {
            "Content-Type": "application/json",
        };

        return fetch(`/API/place/search/${search_text}`, {headers, })
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({
                        maps_hints: result,
                    });
                }
            )
    }


    loadUserHints(search_text){
        if(search_text.length < 3)
            return;

        let headers = {
            "Content-Type": "application/json",
        };

        return fetch(`/API/user/search/${search_text}`, {headers, })
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({
                        user_hints: result,
                    });
                }
            )
    }

    setText(e, place_name, place_id){
         this.setState({
             text: place_name,
             place_id: place_id
         });
    }

    routeChange() {
        if(this.state.place_id) {
            let path = /search/ + this.state.place_id;
            this.props.history.push(path);
        }
        else
            this.props.raiseError("invalid place, choose from list please!");
    }

    updateText(e){
        this.setState({text: e.target.value});
        this.loadUserHints(e.target.value);
        this.loadMapsHints(e.target.value);
    }

    /*  if user click on user result it goes automatically to that user place
        if user click on place result, place result will be copied on the input
        form waiting for the submit
     */

    renderDropdown(){
        const {user_hints, maps_hints} = this.state;
        if(user_hints.length === 0 && maps_hints.length === 0)
            return;

        //creating user hints list from user API
        let user_results;
        if (user_hints.length > 0)
            user_results = user_hints.map(
                (hint, i) =>
                    <Link
                        to={'/experiences/'+ hint.hint}
                        key={"user_" + i}
                        className="dropdown-item"
                        onClick={this.forceUpdate}>{hint.hint}
                    </Link>
                );

        //creating map hints list from google API
        let maps_results;
        if (maps_hints.length > 0)
            maps_results = maps_hints.map(
                (hint, i) =>
                    <a className="dropdown-item" key={i} href="#"
                       onClick={(event) => this.setText(event, hint.hint, hint.key)}>{hint.hint}
                    </a>
            );

        return (
            <>
                <h6 className="dropdown-header">Users</h6>
                {user_results}
                <div className="dropdown-divider"> </div>
                <h6 className="dropdown-header">Places</h6>
                {maps_results}
            </>
        )
    }
    render() {

        return (

            <form className="form-inline">
                <span className="bmd-form-group">

                <div className="dropdown">
                    <input
                        className="form-control mr-sm-2"
                        type="search"
                        placeholder="type a place"
                        aria-label="Search"
                        data-toggle="dropdown"
                        value={this.state.text}
                        onChange={this.updateText.bind(this)}
                    />
                    <div className="dropdown-menu w-100" aria-labelledby="dLabel">
                    {this.renderDropdown()}
                    </div>
                    <button className="btn btn-outline-info my-2 my-sm-0" onClick={this.routeChange}>Explore</button>
                </div>
                </span>
            </form>
        );
    }
}


export default withRouter(Form);
