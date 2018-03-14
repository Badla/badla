import React from 'react'
import CreateProposalForm from '../forms/create-proposal-form'
import FetchProposalForm from '../forms/fetch-proposal-form'
import { BrowserRouter, Link, Route } from 'react-router-dom'
import { Nav, Glyphicon} from 'react-bootstrap'
import Wallet from './wallet'

class App extends React.Component {
    render() {
        return (
            <BrowserRouter>
                <div className="fullHeight main">
                    <Nav>
                        <div className="navitem"><Link to="/create"><Glyphicon glyph="plus" />{" "}Create Proposal</Link></div>
                        <div className="navitem"><Link to="/fetch"><Glyphicon glyph="search" />{" "}Find Proposal</Link></div>
                    </Nav>
                    <div className="page">
                        <Route path="/create" component={CreateProposalForm}/>
                        <Route path="/fetch" component={FetchProposalForm}/>
                        <Route exact path="/" render={() => (
                            <p className="center">
                                <h3>Welcome to Badla.IO</h3>
                                <h5>Please select from menu</h5>
                            </p>
                        )}/>
                        <Wallet accounts={this.props.accounts} />
                    </div>
                </div>
            </BrowserRouter>
        )
    }
}

export default App
