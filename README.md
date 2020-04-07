# Emergency Tenants Protections Map

Mapping states, counties, and municipalities that are enacting emergency tenant protections due to the corona virus pandemic.

## Data Source

Data sourcing is being provided by the [Anti-Eviction Mapping Project](https://www.antievictionmap.com/).

## Developer Instructions

Requires [NodeJS](https://nodejs.org/en/) >= v10.13 and [NPM](https://www.npmjs.com/) >= 6.4 installed and available on the [CLI](https://en.wikipedia.org/wiki/Command-line_interface). (Older versions of Node and NPM may or may not work. To manage multiple NodeJS and NPM versions you may use [NVM](https://github.com/nvm-sh/nvm)).

### Develop

First, using a terminal, in the root level of this repo install the required dependencies do:

```
npm install
```

To start a local web server with live reload do:

```
npm start
```

...then visit `localhost:8080` in your browser.

### Deploying

To create a production build in the `dist` directory do:

```
npm run build
```

To deploy the site to Github Pages on the `gh-pages` branch (this will also run the `build` script above prior to publishing) do:

```
npm run deploy
```

**NOTE:** Use caution when doing this, before deploying you should make sure your build is successful. You may do this by running another webserver, for example using Python, in the `dist` directory after a build, and then viewing the site in your browser:

```bash
# first create a production build
npm run build

# assuming the build was successful,
# change directories to the output directory:
cd dist

# run a local server using python and view your changes on localhost:8000
python -m SimpleHTTPServer 8000

# if all looks good, deploy!
cd ..
npm run deploy
```
