# gulp-changed-smart
> Only pass through changed files

No more wasting precious time on processing unchanged files.

How is this different from [gulp-changed-in-place](https://github.com/alexgorbatchev/gulp-changed-in-place)?
`gulp-changed-in-place` either passes all files or none at startup. This plugin only passes files, that were modified since the last cache update.

## Install

```
$ npm install --save-dev gulp-changed-smart
```

## Usage

```js
const gulp = require('gulp')
const changedSmart = require('gulp-changed-smart')
const tsfmt = require('gulp-tsfmt')

gulp.task('default', () =>
  return gulp.src('src/**/*.js')
    .pipe(changedSmart())
    .pipe(tsfmt())
    .pipe(gulp.dest('src'))
)
```

## API

### changed(options)

#### `cache`
* `Object`
* Default = `{}`

  Object of `{ key: value }` format for all the files that is shared between all runs. Key is a string which contains a path to the file, value is a Date when the file was last modified.

#### `basePath`
* `string`
* Default = `undefined`

  Allows you to set relative path that will be used for storing paths in the `cache`.

# License

The MIT License (MIT)

Copyright (c) 2015 Alex Gorbatchev, 2017 Pascal Führlich; see LICENSE file
