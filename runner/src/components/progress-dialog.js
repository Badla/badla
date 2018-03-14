import React from 'react';
import { Modal, ProgressBar, Button } from 'react-bootstrap';

class ProgressDialog extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        return (
            <Modal.Dialog>
                <Modal.Header>
                    <Modal.Title>{this.props.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className={this.props.msgClass}>{this.props.msg}</div>
                    <br></br>
                    {this.props.done ?
                        this.props.msgClass === "createError" ?
                            <ProgressBar bsStyle="danger" now={this.props.progress} />
                            :
                            <div><ProgressBar bsStyle="success" now={this.props.progress} />
                            {this.props.userData && <pre>{this.props.userData}</pre>}</div>
                        :
                        <ProgressBar striped bsStyle="info" now={this.props.progress} />
                    }
                </Modal.Body>
                { this.props.done &&
                <Modal.Footer>
                    <Button bsStyle="primary" onClick={this.props.onClose}>Close</Button>
                </Modal.Footer>}
            </Modal.Dialog>
        )
    }
}

export default ProgressDialog
