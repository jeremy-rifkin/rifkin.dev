const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

ENTRY_PATH = path.resolve(__dirname, "src/main.ts");
DIST_PATH = path.resolve(__dirname, "dist");

module.exports = {
    entry: {
        index: ENTRY_PATH,
        experiments: ENTRY_PATH,
    },
    output: {
        path: DIST_PATH,
        filename: "[name].[contenthash].js",
        clean: true,
        publicPath: "/",
    },
    module: {
        rules: [
            {
                test: /\.html$/,
                use: ["html-loader"],
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"],
            },
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.s[ac]ss$/,
                use: ["style-loader", "css-loader", "sass-loader"],
            },
            {
                test: /\.(png|jpe?g|gif|svg)$/i,
                type: "asset/resource",
            },
        ],
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "src/index.html"),
            favicon: "./assets/pfp.jpg",
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "src/experiments.html"),
            filename: "experiments.html",
            chunks: ["experiments"],
            favicon: "./assets/pfp.jpg",
        }),
    ],
    devtool: "inline-source-map",
    devServer: {
        static: DIST_PATH,
        hot: true,
    },
};
