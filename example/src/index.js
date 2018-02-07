import './index.css';
import React from 'react';
import ReactDOM from 'react-dom';
import CreateProposalForm from './create-proposal-form'
import FetchProposalForm from './fetch-proposal-form'
import { BrowserRouter, Link, Route } from 'react-router-dom'
import { Nav, NavItem } from 'react-bootstrap';

const App = () => (
    <div className="fullHeight">
        <Nav>
            <NavItem eventKey={1} href="#">
                <Link to="/create">Create Proposal</Link>
            </NavItem>
            <NavItem eventKey={2} href="#">
                <Link to="/fetch">Find Proposal</Link>
            </NavItem>
        </Nav>
        <div className="page">
            <Route path="/create" component={CreateProposalForm}/>
            <Route path="/fetch" component={FetchProposalForm}/>
        </div>
  </div>
)

ReactDOM.render(
    <BrowserRouter>
        <App />
    </BrowserRouter>,
    document.getElementById('content')
)
