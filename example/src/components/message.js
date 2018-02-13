import React from 'react';
import { Button, Alert, Glyphicon } from 'react-bootstrap';

class Message extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        return (
            <Alert bsStyle={this.props.error === "true" ? "danger" : "success"}>
              <p>
                {this.props.msg}
                {this.props.closeable === "true" &&
                    <Button bsStyle="link" className="right-align" onClick={this.props.dismissAlert}>
                        <Glyphicon glyph="remove" />
                    </Button>}
              </p>
            </Alert>
        )
    }
}

export default Message
