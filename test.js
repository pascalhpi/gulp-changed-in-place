const path = require('path')
const fs = require('fs')
const assert = require('assert')
const concatStream = require('concat-stream')
const es = require('event-stream')
const gulp = require('gulp')
const changedSmart = require('./')

describe('gulp-changed-smart', () => {

	// this is more like the gulp object in a real gulpfile
	const virtualGulp = { seq: ['images'], tasks: { images: { running: true } } }

	it('should only pass through files when their modification time changed', done => {
		const times = {}

		const fileA = path.join(__dirname, 'fixture/a')
		const fileB = path.join(__dirname, 'fixture/b')

		const timeNow = Date.now() / 1000 // https://nodejs.org/docs/latest/api/fs.html#fs_fs_utimes_path_atime_mtime_callback

		const timeThen = new Date()
		timeThen.setFullYear(timeThen.getFullYear() - 1)

		const fileBTime = fs.statSync(fileB).mtime.getTime()
		fs.utimesSync(fileA, timeNow, timeNow) //does this work?

		times[fileA] = timeThen
		times[fileB] = fileBTime

		gulp.src('fixture/*')
			.pipe(changedSmart(virtualGulp, { cache: times }))
			.pipe(concatStream(buf => {
				assert.equal(1, buf.length)
				assert.equal('a', path.basename(buf[0].path))
				done()
			}))
	})

	it('should update cache before pushing file to stream', done => {
		const times = {}
		fs.unlinkSync('.gulp-changed-smart.json')

		gulp.src('fixture/*')
			.pipe(changedSmart(virtualGulp, { cache: times }))
			.pipe(es.map((file, callback) => {
				// imitate gulp.dest without actualy writing files
				// @see https://github.com/gulpjs/vinyl-fs/blob/master/lib/prepareWrite.js#L24
				const targetBase = path.resolve(file.cwd, './build')
				const targetPath = path.resolve(targetBase, file.relative)
				file.base = targetBase
				file.path = targetPath
				callback(null, file)
			}))
			.pipe(concatStream(files => {
				assert.equal(2, files.length, 'should be 2 files')

				files.forEach(file => {
					assert.equal(undefined, times[file.path], 'path of changed file should not be in cache')
				})

				done()
			}))
	})

	it('should use paths relative to `basePath`', done => {
		const times = {}
		const basePath = __dirname

		gulp.src('fixture/*')
			.pipe(changedSmart(virtualGulp, {
				basePath: basePath,
				cache: times
			}))
			.pipe(concatStream(files => {

				files.map(file => {
					assert.equal(true, times.hasOwnProperty(path.relative(basePath, file.path)), 'file path should be relative')
				})

				done()
			}))
	})

	it('should only push files on startup that were changed since last cache update', done => {
		const times = { '.gulp-changed-smart-images': new Date(Date.now()) }
        const lastCacheUpdate = times['.gulp-changed-smart-images'].getTime() / 1000

        const fileA = path.join(__dirname, 'fixture/a')
        fs.utimesSync(fileA, 0, lastCacheUpdate + 1) //changed since last cache update
        const fileB = path.join(__dirname, 'fixture/b')
        fs.utimesSync(fileB, 0, lastCacheUpdate - 1) //not changed since last cache update

		gulp.src('fixture/*')
			.pipe(changedSmart(virtualGulp, { cache: times }))
			.pipe(concatStream(files => {
				assert.equal(1, files.length, 'exactly one file was changed since last cache update')
				assert.equal('a', path.basename(files[0].path))
				done()
			}))
	})

	it('sets the timestamp for the correct task', done => {
		//TODO
		assert(false)
	})
})
