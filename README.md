# Badla.IO

Repo and Reverse Repo

## Welcome to badla.io ethereum contract and sample webproject

This document explains how to deploy the badla contract and sample tokens for testing the badla system on a test node. For details on the web frontend to use the badla system check `example/README.md`.

### Dependencies

#### Frameworks and Tools

* [Truffle](http://truffleframework.com) - Used to run a development node, compile and deploy smart contracts

* [MetaMask](http://metamask.io) - A plugin in Chrome browser. It is a wallet to manage accounts and check balances easily. But also does more -
    * Injects a web3 instance into a web DAPP with preconfigured network as chosen by the user in the plugin.

    * Intercepts web3 calls and allows transaction signing outside of the DAPP

#### Alternatives

* `GETH` - MetaMask is a mandatory dependency for the web app and it has issues in connecting to a GETH node as GETH is usually latest and greatest and MetaMask plays catchup.

* `Ganache` or `Ethereum Wallet` - Good to have but not required as the only wallet that matters for the front end is `MetaMask`.

### Development

#### Install Truffle Framework

#### `$ npm install -g truffle`

#### Install MetaMask plugin in Google Chrome

Via this [Extensions Gallery Link](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn)

#### Start a node and open a console to it

#### `$ truffle develop`

It creates a ethereum node and initializes a ethereum blockchain. It also opens a `RPC` endpoint for interaction externally from web3 and is used by `MetaMask` plugin. It also opens a `web3` based console.

#### Compile Badla contract and sample tokens

#### `truffle(develop)> compile`

#### Deploy to the truffle development node
#### `truffle(develop)> deploy`

If everything goes well, the `Badla` and token contract addresses are printed on the console. These addresses are needed in the example app for using the Badla system.

### TestNet

TBD

## References

1. Tutorial - [ ethereum-development-walkthrough-part-2-truffle-ganache-geth-and-mist](https://hackernoon.com/ethereum-development-walkthrough-part-2-truffle-ganache-geth-and-mist-8d6320e12269)
