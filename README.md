# Badla.IO

Repo and Reverse Repo

## Welcome to badla.io ethereum contract and sample webproject

This document explains how to deploy the badla contract and sample tokens for testing the badla system on a test node. For details on the web frontend to use the badla system check `example/README.md`.

### Dependencies

#### Frameworks and Tools

* [Truffle](http://truffleframework.com) - Used to compile smart contracts in Solidity, connect to a ethereum node via its RPC end point, perform operations (like send ether) and deploy smart contracts.

* [MetaMask](http://metamask.io) - A plugin in Chrome browser. It is a wallet to manage accounts and check balances easily. But also does more -
    * Injects a web3 instance into a web DAPP with preconfigured network as chosen by the user in the plugin.

    * Intercepts web3 calls and allows transaction signing outside of the DAPP.

* `Ganache` - It runs a light node on development blockchain that has a instant miner. Creates accounts with preloaded ether. Starts in no time. Also Truffle and MetaMask have been tested to connect and work with this node without any issues.

#### Alternatives

* `GETH` - MetaMask is a mandatory dependency for the web app and it has issues in connecting to a GETH node as GETH is usually latest and greatest and MetaMask plays catchup.

* `Ethereum Wallet` - Its a wallet. Good to have when the DAPP running on testnets but it does not work with light nodes like Ganache. The only required wallet that matters for the DAPP is `MetaMask`

### Install

#### Install Truffle Framework

#### `$ npm install -g truffle`

#### Install Ganache

Via this [link](http://truffleframework.com/ganache/)

#### Install MetaMask plugin in Google Chrome

Via this [Extensions Gallery Link](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn)

#### Install Oraclize Bridge

Via instructions at https://github.com/oraclize/ethereum-bridge.git

### Run (Development)

#### Open Ganache via CLI

#### `$ ganache-cli --secure -u 0 -u 1 -u 2 -u 3 --port 7545 -g 5000 -m "amigo"`
`-m` (pneumonic) keeps the account ids same everytime if the argument is same.

Starts ganache in a CLI and unlocks few accounts.

#### Start a node and open a console to it

#### `$ truffle console --network develop`

It opens a `web3` based console via `RPC` endpoint to ganache.

#### Start oraclize bridge

#### `$ node bridge -H localhost:7545 -a 3`

#### Compile Badla contract and sample tokens

#### `truffle(develop)> compile`

#### Deploy to the truffle development node
#### `truffle(develop)> migrate`

If everything goes well, the `Badla` and token contract addresses are printed on the console. These addresses are needed in the example app for using the Badla system.

### Run (TestNet)

npm install truffle-hdwallet-provider
Signup here and send your Kovan address for test eth: https://gitter.im/kovan-testnet/faucet

## References

1. Tutorial - [ ethereum-development-walkthrough-part-2-truffle-ganache-geth-and-mist](https://hackernoon.com/ethereum-development-walkthrough-part-2-truffle-ganache-geth-and-mist-8d6320e12269)
