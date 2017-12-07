const path = require('path')
const through = require('through2')
const fs = require('fs')

const defaultCache = {}

// look for changes by mtime
const processFile = (stream, basePath, file, cache) => {
	const actualTime = (file.stat && file.stat.mtime).getTime()
	const filePath = basePath ? path.relative(basePath, file.path) : file.path
	const cacheTime = cache[filePath]

	cache[filePath] = actualTime

	if (cacheTime) {
		if (cacheTime !== actualTime) {
			stream.push(file)
		}
	} else if (actualTime > cache['.gulp-changed-smart']) {
		stream.push(file)
	}

	fs.writeFileSync('.gulp-changed-smart', Date.now().toString())
}

module.exports = options => {
	options = options || {}

	const basePath = options.basePath || undefined
	const cache = options.cache || defaultCache

	if (!cache['.gulp-changed-smart']) {
		if (fs.existsSync('.gulp-changed-smart')) {
			const fileContent = fs.readFileSync('.gulp-changed-smart', { encoding: 'utf8' })
			cache['.gulp-changed-smart'] = new Date(parseInt(fileContent))
		} else {
			cache['.gulp-changed-smart'] = new Date(0)
		}
	}

	return through.obj(function(file, encoding, callback) {
		processFile(this, basePath, file, cache)
		callback()
	})
}
