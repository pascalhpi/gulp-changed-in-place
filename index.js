const path = require('path')
const through2 = require('through2')
const fs = require('fs')
const jsonfile = require('jsonfile')

const defaultCache = {}

// look for changes by mtime
const processFile = (stream, basePath, file, cache, runningGulpTask) => {
	const actualTime = (file.stat && file.stat.mtime).getTime()
	const filePath = basePath ? path.relative(basePath, file.path) : file.path
	const cacheTime = cache[filePath]

	cache[filePath] = actualTime

	if (cacheTime) {
		if (cacheTime !== actualTime) {
			stream.push(file)
		}
	} else if (actualTime > cache[`.gulp-changed-smart-${runningGulpTask}`]) {
		stream.push(file)
	}
}

const readLastCacheUpdates = () => {
	if (!fs.existsSync('.gulp-changed-smart.json')) {
		return {}
	}
	return jsonfile.readFileSync('.gulp-changed-smart.json')
}

module.exports = (gulp, options) => {
	options = options || {}

	const basePath = options.basePath || undefined
	const cache = options.cache || defaultCache

	const runningGulpTask = gulp.seq.filter( task => gulp.tasks[task].running )[0] || 'none'

	const timeStamp = parseInt(readLastCacheUpdates()[runningGulpTask] || '0')
	cache[`.gulp-changed-smart-${runningGulpTask}`] = new Date(timeStamp)

	return through2({ objectMode: true },
		function(file, encoding, callback) {
			processFile(this, basePath, file, cache, runningGulpTask)
			callback()
		},
		callback => {//flush function, called before ending stream
			const lastCacheUpdate = readLastCacheUpdates()
			lastCacheUpdate[runningGulpTask] = Date.now().toString()
			jsonfile.writeFileSync('.gulp-changed-smart.json', lastCacheUpdate)
			callback()
		}
	)
}
