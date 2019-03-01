import React from 'react';
import {Link} from 'react-router-dom';
import Search from './Search/Form';

class Navbar extends React.Component {

    profile(){
        if(!this.props.isAuth){
            return (
                <li className="nav-item">
                    <Link to={'/login'} className="nav-link">Login</Link>
                </li>
            );
        }
        else {
            return (
                <>
                    <li className="nav-item">
                        <Link to={'/feed'} className={'nav-link'}>news feed</Link>
                    </li>
                    <li className="nav-item dropdown">
                        <a className="nav-link dropdown-toggle" href="#" id="navbarDropdownMenuLink"
                           data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            {this.props.username}
                        </a>
                        <div className="dropdown-menu" aria-labelledby="navbarDropdownMenuLink">
                            <Link to={'/experiences'} className="dropdown-item">Your profile</Link>
                            <Link to={'/settings'} className="dropdown-item">Settings</Link>
                            <Link to={'/login'} className="dropdown-item" onClick={this.props.signOut}>Logout</Link>
                        </div>
                    </li>
                </>
            )
        }
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
                        { this.profile() }
                    </ul>
                    <Search
                        raiseError={this.props.raiseError}
                    />
                </div>
            </nav>
        );
    }
}

export default Navbar;

