import React from 'react';
import {Link} from 'react-router-dom';

class Navbar extends React.Component {

    loggedPart(){
        return(
            <div>
                <li className="nav-item">
                    <Link to={'/'} className="nav-link" onClick={this.props.signOut}>Logout</Link>
                </li>
            </div>
        );
    }

    guestPart(){
        return(
            <li className="nav-item">
                <Link to={'/login'} className="nav-link">Login</Link>
            </li>
        );
    }

    render(){

        return(
            <nav className="navbar sticky-top navbar-expand-lg navbar-dark bg-dark">
                <Link to={'/'} className={'navbar-brand active'}>MyTrip</Link>

                <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarColor01"
                        aria-controls="navbarColor01" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"> </span>
                </button>

                <div className="navbar-collapse collapse" id="navbarColor01">
                    <ul className="navbar-nav mr-auto">
                        <li className="nav-item">
                            <Link to={'/about'} className={'nav-link'}>about us</Link>
                        </li>
                        { this.props.isAuth ? this.loggedPart() : this.guestPart() }
                    </ul>
                    <form className="form-inline">
                        <span className="bmd-form-group">
                            <input className="form-control mr-sm-2" type="search" placeholder="type a place.." aria-label="Search"/>
                        </span>
                        <button className="btn btn-outline-info my-2 my-sm-0" type="submit">Explore</button>
                    </form>
                </div>
            </nav>
        );
    }
}

export default Navbar;
