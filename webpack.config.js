const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

// this defines a configuration object that NodeJS can pass to Webpack
module.exports = {
  // specify Webpack's "mode" as "development";
  // we can also specify "production" for a production optimized build
  mode: "development",

  // "entry" points to our source file(s) which is used to create Webpack's dependency tree
  entry: {
    index: "./src/index.js"
  },

  // "output" specifies where our processed files will end up
  output: {
    // this tells webpack to use the same name as the key from "entry" above
    filename: "[name].js",

    // tell webpack to put our processed files in a directory called "dist"
    path: path.resolve(__dirname, "dist")
  },

  // "devtool" tells webpack what type of source maps to use
  devtool: "inline-source-map",

  // configuration for webpack's development server
  devServer: {
    contentBase: "./dist"
  },

  // "module" is where we tell webpack how to handle our various modules / files
  module: {
    // "rules" tells webpack how it should handle file types
    rules: [
      // this "rule" tells webpack what "loaders" to use to process our CSS
      {
        // use a Regular Expression to tell webpack what type of file(s) this rule targets
        test: /\.css$/,
        // tell webpack what "loaders" to use to process this file type, in this order
        use: ["style-loader", "css-loader"]
      }
    ]
  },

  // what plugins Webpack should use for advanced functionality
  plugins: [
    // makes sure our output folder is cleaned before adding new files to it
    new CleanWebpackPlugin(),

    // handles HTML files
    new HtmlWebpackPlugin({ template: "./public/index.html" }),

    // handles copying files that aren't "imported" into our JS to the output directory
    new CopyPlugin(["./data/states.geojson"])
  ]
};
