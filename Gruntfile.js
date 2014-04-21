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
      lib: [
        'Gruntfile.js',
        'index.js',
        'lib/*.js'
      ],
      test: {
        options: {
          jshintrc: 'test/.jshintrc'
        },
        src: [
          'test/*.js'
        ]
      }
    },
    mochacli: {
      options: {
        ui: 'bdd',
        reporter: 'spec'
      },
      test: [
        'test/*.js'
      ]
    },
    watch: {
      lib: {
        files: [
          'Gruntfile.js',
          'index.js',
          'lib/*.js'
        ],
        tasks: ['jshint:lib', 'test']
      },
      test: {
        files: [
          'test/*.js',
        ],
        tasks: ['jshint:test', 'test']
      }
    }
  });

  grunt.loadTasks('tasks');

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-cli');
  grunt.loadNpmTasks('grunt-notify');

  grunt.registerTask('test', ['clean', 'fixtures', 'mochacli']);
  grunt.registerTask('default', ['test', 'jshint']);
};
