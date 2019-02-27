import React from 'react';

class About extends React.Component {

    render(){

        return(
            <div className="row mt-5">
                <div className="col">
                    <div className="card">
                        <h5 className="card-header">what is this</h5>
                        <div className="card-body">
                            <h5 className="card-title">a student project</h5>
                            <p className="card-text">
                                this website was built as a project for a subject at
                                university of Modena. For more information or any claim about it
                                click on the button below and text me.
                            </p>
                            <a href="https://t.me/potpov" className="btn btn-primary">telegram contact</a>
                        </div>
                    </div>
                </div>
                <div className="col">
                    <div className="card">
                        <h5 className="card-header">website terms</h5>
                        <div className="card-body">
                            <blockquote className="blockquote mb-0">
                                <p>gonna put some policy here very soon.</p>
                                <footer className="blockquote-footer">Marco</footer>
                            </blockquote>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default About;

