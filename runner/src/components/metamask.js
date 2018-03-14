import React from 'react'
import { Alert} from 'react-bootstrap'

const NoMetaMask = () => {
    return (
        <Alert bsStyle="danger">
            <p className="center fullHeight">
            Badla needs metamask plugin installed in your browser and intialized.
            Please visit&nbsp;<a target="_blank" rel="noopener noreferrer" href="https://metamask.io">metamask.io</a>
            <br />
            <img alt="metamask-logo" className="metamaskDownload" src="download-metamask-dark.png" width="200" />
            </p>
        </Alert>
    )
}

const MetaMaskNotEnabled = () => {
    return (
        <Alert bsStyle="danger" className="center">Please open metamask and unlock wallet or add some accounts</Alert>
    )
}

export {MetaMaskNotEnabled, NoMetaMask}
