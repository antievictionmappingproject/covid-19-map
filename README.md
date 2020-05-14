# COVID-19 Emergency Tenants Protections Map

Mapping states, counties, and municipalities that are enacting emergency tenant protections due to COVID-19 (the novel corona virus) pandemic, as well as where organized rent strikes are taking place.

## Data Source

Data sourcing and maintenance is being provided by the [Anti-Eviction Mapping Project](https://www.antievictionmap.com/).

**DISCLAIMER:** This data is by no means perfect or exhaustive of all emergency tenant protection policies in the United States and elsewhere. It has been crowdsourced and is maintained by a team of dedicated volunteers. If you notice something missing or incorrect in the data, please [reach out to us](mailto:antievictionmap@riseup.net) to let us know so we may update it accordingly!

## Developer Instructions

Getting this project running locally requires that:

1. You are comfortable running programs on the [CLI](https://en.wikipedia.org/wiki/Command-line_interface) such as the [Terminal](https://support.apple.com/guide/terminal/welcome/mac) program on MacOS.

2. You have installed [NodeJS](https://nodejs.org/en/) >= `v10.13` and either the [Yarn](https://yarnpkg.com/) >= `1.22` or [NPM](https://www.npmjs.com/) >= `6.4` (NPM should automatically be installed with NodeJS). Older versions of any of these may or may not work.

### Develop

First, in the root level of this repo install the required package dependencies by doing:

```
yarn install
```

or

```
npm install
```

To start a local web server with live reload do:

```
yarn start
```

or

```
npm start
```

Then visit `localhost:8080` in your browser.

---

To create a production optimized build that will be outputted in the `dist` directory do:

```
yarn build
```

or

```
npm run build
```

### Deploying

To deploy the site to Github Pages on the `gh-pages` branch (this will also run the `build` script above prior to publishing) do:

```
yarn deploy
```

or

```
npm run deploy
```

You will need to have write privileges to this repository on Github to be able to do this.

**NOTE: Use caution when doing this**, *before deploying you should make sure your build is successful and runs as expected. You may do this by running the script `start:prod` which will create a production build then start a local server in the dist directory.*

View the site using the output / bundled files from Webpack using `http-server`:

```
yarn start:prod
```
