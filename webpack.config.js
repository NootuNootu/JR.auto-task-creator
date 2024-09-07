const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = (env, argv) => ({
    entry: {
        generateTasks: "./src/generateTasks.ts"
    },
    output: {
        filename: "[name].js"
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
        alias: {
            "azure-devops-extension-sdk": path.resolve("node_modules/azure-devops-extension-sdk")
        },
    },
    stats: {
        warnings: false
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader"
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/, 
                type: 'asset/inline'
            },
            {
                test: /\.html$/, 
                type: 'asset/resource'
            }
        ]
    },
    plugins: [
        new CopyWebpackPlugin({
           patterns: [ 
               { from: "src/index.html" }
           ]
        })
    ],
    ...(env.WEBPACK_SERVE
        ? {
              devtool: 'inline-source-map',
              devServer: {
                  server: 'https',
                  port: 3000
              }
          }
        : {})
});
