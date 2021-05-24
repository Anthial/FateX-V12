/* eslint-disable */
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const ESLintPlugin = require("eslint-webpack-plugin");
const globImporter = require("node-sass-glob-importer");
const path = require("path");
const glob = require("glob");

const allTemplates = () => {
    return glob
        .sync("**/*.hbs", { cwd: path.join(__dirname, "system/templates") })
        .map((file) => `"systems/fatex/templates/${file}"`)
        .join(", ");
};

module.exports = (env) => {
    const defaults = {
        watch: false,
        mode: "development",
    };

    const environment = { ...defaults, ...env };
    const isDevelopment = environment.mode === "development";

    const config = {
        entry: "./src/fatex.ts",
        watch: environment.watch,
        devtool: "inline-source-map",
        stats: "minimal",
        mode: environment.mode,
        resolve: {
            extensions: [".wasm", ".mjs", ".ts", ".js", ".json"],
        },
        output: {
            filename: "system.js",
            path: path.resolve(__dirname, "dist"),
            publicPath: "/systems/fatex/",
        },
        devServer: {
            hot: true,
            firewall: false,
            proxy: [
                {
                    context: (pathname, req) => {
                        if (req.headers.host.match("^foundry8.local")) {
                            return false;
                        }

                        return !pathname.match("^/ws");
                    },
                    target: "http://localhost:30000",
                    ws: true,
                },
                {
                    context: (pathname, req) => {
                        if (req.headers.host.match("^foundry.local")) {
                            return false;
                        }

                        return !pathname.match("^/ws");
                    },
                    target: "http://localhost:40000",
                    ws: true,
                },
            ],
        },
        module: {
            rules: [
                isDevelopment
                    ? {
                          test: /\.hbs$/,
                          loader: "raw-loader",
                      }
                    : {
                          test: /\.hbs$/,
                          loader: "null-loader",
                      },
                {
                    test: /\.ts$/,
                    use: ["ts-loader", "webpack-import-glob-loader", "source-map-loader"],
                },
                {
                    test: /TemplatePreloader\.ts$/,
                    use: [
                        {
                            loader: "string-replace-loader",
                            options: {
                                search: '"__ALL_TEMPLATES__"',
                                replace: allTemplates,
                            },
                        },
                    ],
                },
                {
                    test: /\.scss$/,
                    use: [
                        "style-loader",
                        {
                            loader: "css-loader",
                            options: {
                                sourceMap: isDevelopment,
                                url: false,
                            },
                        },
                        {
                            loader: "postcss-loader",
                        },
                        {
                            loader: "sass-loader",
                            options: {
                                sourceMap: isDevelopment,
                                sassOptions: {
                                    importer: globImporter(),
                                },
                            },
                        },
                    ],
                },
            ],
        },
        plugins: [
            new CleanWebpackPlugin(),
            new ESLintPlugin({
                extensions: ["ts"],
            }),
            new CopyPlugin({
                patterns: [{ from: "system" }],
            }),
        ],
    };

    if (!isDevelopment) {
        delete config.devtool;
    }

    return config;
};
