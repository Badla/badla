import './index.css';
import React from 'react';
import ReactDOM from 'react-dom';
import CreateProposalForm from './create-proposal-form'
import FetchProposalForm from './fetch-proposal-form'
import { BrowserRouter, Link, Route } from 'react-router-dom'
import { Nav, NavItem } from 'react-bootstrap';

const App = () => (
    <div className="fullHeight main">
        <Nav>
            <div className="navitem"><Link to="/create">Create Proposal</Link></div>
            <div className="navitem"><Link to="/fetch">Find Proposal</Link></div>
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
