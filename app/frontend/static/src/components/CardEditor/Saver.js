/* minimal webcomponents here */
import React from "react";

function SaveButton(props) {
  return (
    <div>
        <div className="mt-0 text-center">
            <button type="button" className="mb-0 btn btn-raised btn-success w-50 p-3"
                    data-toggle="modal" data-target="#saverConfirm">
                    SAVE CHANGES
            </button>
        </div>

        <div className="modal fade" id="saverConfirm" tabIndex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="exampleModalLongTitle">confirm?</h5>
                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                Are you sure to save this timeline?
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-dismiss="modal">Cancel</button>
                <button type="button" onClick={props.onClick} data-dismiss="modal" className="btn btn-primary">yes, update it!</button>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}

export default SaveButton;