﻿const path = require('path')
const ExtractTextWebpackPlugin = require('extract-text-webpack-plugin')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const productionConfig = require('./webpack.prod.conf')
const developmentConfig = require('./webpack.dev.conf')
const merge = require('webpack-merge')

const generateConfig = env => {
	const extractLess = new ExtractTextWebpackPlugin({
		filename: 'css/[name]-bundle-[hash:5].css'
	})
	const scriptLoader = [
		{
			loader: 'babel-loader'
		}
	].concat(
		env === 'production'
			? []
			: [
					{
						// 放置 babel-loader 之后
						loader: 'eslint-loader',
						// loader: 'happypack/loader?id=eslint',
						options: {
							formatter: require('eslint-friendly-formatter')
						}
					}
			  ]
	)
	const cssLoaders = [
		{
			/* 打包时把 css 文件拆出来，css相关模块最终打包到一个指定的css文件中，我们手动用link标签去引入这个css文件就可以了 */
			loader: 'css-loader',
			options: {
				sourceMap: env === 'developement',
				/* 在 css-loader 前应用的 loader 的数量 */
				importLoaders: 2,
				/* 是否压缩 */
				minimize: true,
				/* 启用 css-modules */
				modules: true,
				/* 定义编译出来的名称 */
				localIdentName: '[path][name]_[local]_[hash:base64:5]'
			}
		},
		{
			/* 用 js 处理 css, 打包时期 */
			loader: 'postcss-loader',
			options: {
				sourceMap: env === 'developement',
				ident: 'postcss',
				plugins: [
					/* 加 css 各浏览器前缀 */
					require('autoprefixer')(),
					/* 使用未来的 css 语法 */
					require('postcss-cssnext')(),
					/* 压缩 css */
					require('cssnano')()
				].concat(
					env === 'production'
						? require('postcss-sprites')({
								spritePath: 'dist/assets/imgs/sprites',
								retina: true
						  })
						: []
				)
			}
		},
		{
			/* 放置 css-loader 下面 */
			loader: 'sass-loader',
			options: {
				sourceMap: env === 'developement'
			}
		}
	]
	const styleLoader =
		env === 'production'
			? extractLess.extract({
					fallback: 'style-loader',
					use: cssLoaders
			  })
			: [
					{
						// hot: true -> style-loader 要去除 ExtractTextWebpack 包裹
						loader: 'style-loader'
					}
			  ].concat(cssLoaders)
	const fileLoader =
		env === 'development'
			? [
					{
						loader: 'file-loader',
						options: {
							name: '[name]-[hash:5].[ext]',
							outputPath: 'assets/imgs/'
						}
					}
			  ]
			: [
					{
						loader: 'url-loader',
						options: {
							name: '[name]-[hash:5].[ext]',
							limit: 1000,
							outputPath: 'assets/imgs/'
						}
					}
			  ]

	return {
		entry: {
			app: './src/app.js'
		},
		output: {
			/* 输出到指定目录下 */
			path: path.resolve(__dirname, '../dist'),
			/* 输出文件都带有 / 前缀 */
			publicPath: '/',
			filename: 'js/[name]-bundle-[hash:5].js',
			chunkFilename: '[name].bundle.js'
		},
		resolve: {
			alias: {
				/* 找到本地的 jquery */
				jquery$: path.resolve(__dirname, '../src/libs/jquery.min.js')
			}
		},
		module: {
			rules: [
				{
					test: /\.js$/,
					include: [path.resolve(__dirname, '../src')],
					exclude: [path.resolve(__dirname, '../src/libs')],
					use: [scriptLoader]
				},
				{
					test: /\.scss$/,
					use: [styleLoader]
				},
				{
					test: /\.(png|jpg|jpeg|gif)$/,
					use: fileLoader.concat(env === 'production')
						? {
								loader: 'img-loader',
								options: {
									pngquant: {
										quality: 80
									}
								}
						  }
						: []
				},
				{
					/* 字体文件 */
					test: /\.(eot|woff2?|ttf|svg)$/,
					use: [fileLoader]
				}
			]
		},
		plugins: [
			/* 提取 css */
			extractLess,
			new webpack.ProvidePlugin({
				/* 使用 install jquery */
				$: 'jquery'
			}),
			/* 生成创建 html 入口文件 */
			new HtmlWebpackPlugin({
				/* filename: 输出文件的名字 */
				filename: 'index.html',
				/* template: 本地模版的位置 */
				template: './index.html',
				/* 压缩 */
				minify: {
					collapseWhitespace: true
				}
			})
		]
	}
}

module.exports = env => {
	let config = env === 'production' ? productionConfig : developmentConfig
	return merge(generateConfig(env), config)
}
