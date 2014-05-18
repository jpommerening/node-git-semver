module.exports = function (grunt) {
  'use strict';

  grunt.initConfig({
    clean: {
      tests: ['tmp']
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      lib: {
        src: [
          __filename,
          'index.js',
          'lib/*.js'
        ]
      },
      test: {
        options: {
          jshintrc: 'test/.jshintrc'
        },
        src: [
          'tasks/*.js',
          'test/fixtures/*.js',
          'test/*.js'
        ]
      }
    },
    mochacli: {
      options: {
        ui: 'bdd',
        reporter: 'spec'
      },
      test: {
        src: [ 'test/*.js' ]
      }
    },
    watch: {
      lib: {
        files: [
          __filename,
          'index.js',
          'lib/*.js'
        ],
        tasks: ['newer:jshint:lib', 'mochacli']
      },
      test: {
        files: [
          'test/*.js',
        ],
        tasks: ['newer:jshint:test', 'newer:mochacli:test']
      }
    }
  });

  grunt.loadTasks('tasks');

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-cli');
  grunt.loadNpmTasks('grunt-notify');
  grunt.loadNpmTasks('grunt-newer');

  grunt.registerTask('test', ['clean', 'fixtures', 'mochacli']);
  grunt.registerTask('default', ['test', 'jshint']);
};
