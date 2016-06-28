module.exports = function (grunt) {
	'use strict';
	grunt.initConfig({
		cfg : grunt.file.readJSON('config.json'),
		aglio : {
			api : {
				files : {
					'<%= cfg.path %>/index.html' : '<%= cfg.source %>'
				},
				options : {
					themeTemplate : "templates/scheme.jade",
					separator : "\n"
				}
			}
		},
		copy : {
			font : {
				files : [
					{
						expand : true,
						flatten : true,
						src : [ 'node_modules/font-awesome/fonts/*' ],
						dest : '<%= cfg.path %>/font/fontawesome/',
						filter : 'isFile'
					}
				]
			},
			js : {
				files : [
					{
						expand : true,
						flatten : true,
						src : [
							'node_modules/jquery/dist/jquery.min.js',
							'node_modules/bootstrap/dist/js/bootstrap.min.js'
						],
						dest : '<%= cfg.path %>/js/',
						filter : 'isFile'
					}
				]
			},
			img : {
				files : [
					{
						expand : true,
						flatten : true,
						src : [ 'img/*' ],
						dest : '<%= cfg.path %>/img',
						filter : 'isFile'
					}
				]
			}
		},
		less : {
			fontawesome : {
				options : '<%= cfg.lessc %>',
				files : { '<%= cfg.path %>/css/fontawesome.min.css' : 'less/fontawesome/fontawesome.less' }
			},
			bootstrap : {
				options : '<%= cfg.lessc %>',
				files : { '<%= cfg.path %>/css/bootstrap.min.css' : 'less/bootstrap/bootstrap.less' }
			},
			app : {
				options : '<%= cfg.lessc %>',
				files : { '<%= cfg.path %>/css/app.min.css' : 'less/app.less' }
			}
		},
		watch : {
			aglio : {
				files : [ 'src/**/*.md', 'templates/**/*jade' ],
				tasks : [ 'aglio' ]
			},
			lessapp : {
				files : [ 'less/*.less' ],
				tasks : [ 'less:app' ]
			},
			lessbootstrap : {
				files : [ 'less/bootstrap/**/*.less' ],
				tasks : [ 'less:bootstrap' ]
			},
			lessfontawesome : {
				files : [ 'less/fontawesome/**/*.less' ],
				tasks : [ 'less:fontawesome' ]
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-aglio');

	grunt.registerTask('default', [ 'less', 'copy', 'aglio', 'watch' ]);
	grunt.registerTask('production', [ 'less', 'copy', 'aglio' ]);
};