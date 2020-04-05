const path = require("path");
const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const TerserJSPlugin = require("terser-webpack-plugin");

// `module.exports` is NodeJS's way of exporting code from a file,
// so that it can be made available in other files. It's what
// enables Webpack to read our configuration from a .js file (rather than for example a JSON file)
module.exports = (env, argv) => {
  /**
   * Whether or not we're in development mode.
   * This affects how some of the config options are set
   */
  const devMode = argv.env.NODE_ENV !== "production";

  if (argv.mode === "development") {
    console.log("webpack is in dev mode");
  } else if (argv.mode === "production") {
    console.log("webpack is in production mode");
  } else {
    console.log("webpack has no mode defined");
  }

  /******************************************************************************
   * Define a configuration object that instructs how Webpack should handle our code
   ******************************************************************************/
  const config = {
    /******************************************************************************
     * specify Webpack's "mode", typically either "development" or "production"
     * we currently set this using the CLI, see the "scripts" in package.json
     * so it's commented out below. Many of webpack's options can be specified
     * either by the CLI or the config file.
     ******************************************************************************/
    // mode: argv.mode,

    /******************************************************************************
     * Which file(s) are used to create Webpack's dependency tree
     * Note there can be multiple entries, for example for different HTML pages
     * The key (e.g. "index") can be referenced elsewhere in the configuration
     ******************************************************************************/
    entry: {
      index: "./src/index.js"
    },

    /******************************************************************************
     * Where our processed files will end up and how they are named
     ******************************************************************************/
    output: {
      // "[name]" tells webpack to use the same name as the key from "entry" above
      // "[chunkhash]" gives the output file(s) a "hash", which will help with cache-busing browsers
      filename: devMode ? "[name].js" : "[name].[contenthash].js",

      // tell webpack to put our processed files in a directory called "dist"
      path: path.resolve(__dirname, "dist")
    },

    /******************************************************************************
     * The type of source maps to use for any transformed code
     ******************************************************************************/
    devtool: "source-map",

    /******************************************************************************
     * Configuration for webpack's development server
     ******************************************************************************/
    devServer: {
      contentBase: "./dist",
      // use webpack's hot module replacement
      // see: https://webpack.js.org/guides/hot-module-replacement/
      hot: true
    },

    /******************************************************************************
     * "module" is where we tell webpack how to handle our various modules / files
     ******************************************************************************/
    module: {
      // "rules" tells webpack how it should handle file types
      rules: [
        // this "rule" tells webpack what "loaders" to use to process our CSS
        {
          // use a Regular Expression to tell webpack what type of file(s) this rule targets
          test: /\.css$/,
          // tell webpack what "loaders" to use to process this file type
          use: [
            {
              // use the  MiniCssExtractPlugin's loader
              loader: MiniCssExtractPlugin.loader,
              options: {
                // enables hot module replacement for css files
                hmr: devMode,
                // fallback to a full page reload if hmr is not present
                reloadAll: true
              }
            },
            "css-loader"
          ]
        },

        // this "rule" tells webpack what "loader(s)" to use to process our JS
        {
          // only target .js files
          test: /\.js$/,

          // tell webpack to ignore the node_modules directory for this rule
          exclude: /node_modules/,

          // many options in webpack's config can take a value as an array or object
          // here we're specify an object with additonal properties, such as
          // plugins for babel to use
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                [
                  "@babel/preset-env",
                  {
                    useBuiltIns: "entry",
                    targets: "> 0.25%, not dead",
                    corejs: { version: 3, proposals: true }
                  }
                ]
              ],
              plugins: ["@babel/plugin-proposal-object-rest-spread"]
            }
          }
        }
      ]
    },

    /******************************************************************************
     * "optimization" specifies how webpack should handle code optimization when it's being transpiled
     * for example, we can split our source code from our "vendor" dependencies
     ******************************************************************************/
    optimization: {
      moduleIds: "hashed",
      runtimeChunk: "single",

      // how to handle code minimization in production
      minimizer: [
        new TerserJSPlugin({
          test: /\.js(\?.*)?$/i,
          exclude: /node_modules/,
          terserOptions: {
            output: {
              comments: /@license/i
            }
          },
          extractComments: true,
          sourceMap: true
        }),
        new OptimizeCSSAssetsPlugin({})
      ],

      // how webpack should split our code compiled into separate files for production
      splitChunks: {
        chunks: "all",

        // handles how webpack caches related code
        cacheGroups: {
          // group any of our 3rd party modules installed via npm/yarn that live in node_modules
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all"
          },

          // group any css
          styles: {
            name: "styles",
            test: /\.css$/,
            chunks: "all",
            enforce: true
          }
        }
      }
    },

    /******************************************************************************
     * What plugins Webpack should use for more advanced & customized configuration
     * see: https://webpack.js.org/plugins/
     ******************************************************************************/
    plugins: [
      // makes sure our output folder is cleaned before adding new files to it
      new CleanWebpackPlugin(),

      // handles HTML files
      new HtmlWebpackPlugin({ template: "./public/index.html" }),

      // handles copying files that aren't "imported" into our JS to the output directory
      new CopyPlugin([
        "./data/states.geojson",
        { from: "public/assets/mapIcons", to: "assets/mapIcons" }
      ]),

      // handles extracting our CSS into a file(s)
      new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        // all options are optional
        filename: devMode ? "[name].css" : "[name].[contenthash].css",
        chunkFilename: devMode ? "[id].css" : "[id].[contenthash].css",
        ignoreOrder: false // Enable to remove warnings about conflicting order
      }),

      // allows for variables to be available in our app code
      // helpful for enabling certain things when in development that you might not
      // want in production, such as logging
      new webpack.DefinePlugin({
        "process.env.NODE_ENV": JSON.stringify(argv.env.NODE_ENV)
      })
    ]
  };

  return config;
};
