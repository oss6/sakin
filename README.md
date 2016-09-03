# sakin [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]
> A simple yet versatile and efficient static site generator

## Installation

```sh
$ npm install -g sakin
```

## Basic usage

```sh
# Create a website in the current directory
$ sakin --init

# Create an article in contents/articles
$ sakin --article "Hello everyone"

# Create a page in contents/pages
$ sakin --page "About me"

# Generate the website
$ sakin --generate

# Preview the website
$ sakin --serve 8080

# Publish the website
$ sakin --publish
```
## License

MIT © [oss6](oss6.github.io)


[npm-image]: https://badge.fury.io/js/sakin.svg
[npm-url]: https://npmjs.org/package/sakin
[travis-image]: https://travis-ci.org/oss6/sakin.svg?branch=master
[travis-url]: https://travis-ci.org/oss6/sakin
[daviddm-image]: https://david-dm.org/oss6/sakin.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/oss6/sakin
[coveralls-image]: https://coveralls.io/repos/oss6/sakin/badge.svg
[coveralls-url]: https://coveralls.io/r/oss6/sakin
