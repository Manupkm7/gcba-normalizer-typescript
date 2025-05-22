import path from 'path';
import { fileURLToPath } from 'url';
import TerserPlugin from 'terser-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const libraryName = 'normalizador';

const config = env => {
  const isProduction = env.production;

  return {
    mode: isProduction ? 'production' : 'development',
    entry: './src/index.ts',
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    output: {
      path: path.resolve(__dirname, 'lib'),
      filename: `${libraryName}${isProduction ? '.min' : ''}.js`,
      library: {
        name: libraryName,
        type: 'umd',
        export: 'default',
      },
      globalObject: 'this',
      clean: true,
    },
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            format: {
              comments: false,
            },
            compress: {
              drop_console: isProduction,
            },
          },
          extractComments: false,
        }),
      ],
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
              plugins: ['@babel/plugin-transform-runtime'],
            },
          },
        },
      ],
    },
    resolve: {
      modules: [path.resolve('./node_modules'), path.resolve('./src')],
      extensions: ['.js'],
    },
    externals: {
      'node-fetch': {
        commonjs: 'node-fetch',
        commonjs2: 'node-fetch',
        amd: 'node-fetch',
        root: 'fetch',
      },
    },
  };
};

export default config;
