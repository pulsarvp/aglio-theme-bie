(function () {
	exports.getConfig = function () {
		return {
			formats : [ '1A' ],
			options : []
		};
	};

	exports.render = function (input, options, done) {
		done(null, 'Hello!');
	};

}).call(this);
