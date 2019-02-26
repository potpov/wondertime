/* minimal webcomponents here */
import React from "react";

function Deleter(props) {
  return (
    <div>
       <i data-toggle="modal" className="link-danger" data-target="#deleterConfirm"> delete this timeline </i>

        <div className="modal fade" id="deleterConfirm" tabIndex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="exampleModalLongTitle">confirm?</h5>
                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                do you really want to remove timeline <i>{props.timeline}</i>?
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-dismiss="modal">nop, sorry</button>
                <button type="button" onClick={props.onClick} data-dismiss="modal" className="btn btn-primary">yes, remove it!</button>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}

export default Deleter;