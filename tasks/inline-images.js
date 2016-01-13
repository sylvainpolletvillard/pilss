var cheerio = require('cheerio');
var path = require('path');
var fs = require('fs');
var url = require('url');
var gutil = require('gulp-util');
var through = require('through2');
var gm = require('gm');
var Q = require("q");

var PluginError = gutil.PluginError;

const PLUGIN_NAME = 'gulp-inline-image';

var contentTypes = {
	".png": "image/png",
	".gif": "image/gif",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".bmp": "image/bmp",
	".webp": "image/webp"
};

function isLocal(href) {
	return href && !url.parse(href).hostname;
}

function inlineImagesInHTML(file, base, cb) {
	base = base || process.cwd();
	var html = file.contents;

	var dom = cheerio.load(String(html));
	var promises = [];

	dom('img').each(function(idx, el) {
		el = dom(el);
		var src = el.attr('src');
		if (src && isLocal(src)) {
			el.attr('data-originalsrc', src);
			var filepath = path.join(base, src);
			var deferred = Q.defer();

			var img = gm(filepath);
			img.size(function(err, size){
				if (err) return deferred.reject(new Error(err));
				if(size.width < 300){ return deferred.resolve(); }
				el.attr('width', size.width);
				el.attr('height', size.height);
				img.type("Optimize")
					.quality(50)
					.resize(300)
					.toBuffer(function(err, buffer) {
						if (err) return deferred.reject(new Error(err));
						var contentType = contentTypes[path.extname(filepath)] || 'image/png';
						var dataUri = "data:" + contentType + ";base64," + buffer.toString("base64");
						el.attr('src', dataUri);
						deferred.resolve();
					});
			})


			promises.push(deferred.promise);
		}
	});

	Q.all(promises).then(
		function(results) {
			console.log("[PILSS] image replacements done for ", file.path);
			file.contents = new Buffer(dom.html({ decodeEntities: false }));
			cb(null, file);
		},
		function(err) {
			cb(err,new PluginError(err));
		}
	);

}

module.exports = function inlineImage(dir) {
	var stream = through.obj(function(file, enc, cb) {
		if (file.isStream()) {
			this.emit('error', new PluginError(PLUGIN_NAME, 'Streams not supported!'));
		} else if (file.isBuffer()) {
			inlineImagesInHTML(file, dir, cb);
			this.push(file);
		} else {
			return cb(null, file); //no-op
		}
	});

	return stream;
}