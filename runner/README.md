# Badla.IO web based DAPP?

Make sure you are in the `examples` directory

### Install server dependencies

##### `npm install`


### Install [MetaMask](http://metamask.io) Plugin In Chrome Browser

MetaMask is a plugin for Chrome browser. It is a wallet to manage accounts and check balances easily. But also does more -
* Injects a web3 instance into a web DAPP with preconfigured network as chosen by the user in the plugin.

* Intercepts web3 calls and allows transaction signing outside of the DAPP

### Development

##### `npm start`
<br>
Open [http://localhost:3000](http://localhost:3000) in  chrome browser<br>
The page will reload if you make edits<br>
You will also see lint errors in the console and other errors in web too which you can click to highlight the line of code directly within Atom.

### Deployment

##### Make a static deployable build
##### `npm run build`
##### Test the build using ` Serve` `(npm install -g serve)`
##### `serve -s build`
Open the link as shown in the serve output to access the build as a web site. (Usually http://localhost:5000)
##### Deploy the build folder to the static server like Amazon S3
