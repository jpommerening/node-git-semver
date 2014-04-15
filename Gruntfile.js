module.exports = function (grunt) {
  'use strict';

  grunt.initConfig({
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      lib: [
        'Gruntfile.js',
        'index.js',
        'lib/*.js',
        'test/*.js'
      ]
    },
    mochacli: {
      options: {
        ui: 'bdd'
      },
      all: [
        'test/*.js'
      ]
    },
    watch: {
      all: {
        files: [
          'Gruntfile.js',
          'index.js',
          'lib/*.js',
          'test/*.js',
        ],
        tasks: ['jshint', 'test']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-cli');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-notify');
  
  grunt.registerTask('test', ['mochacli']);
  grunt.registerTask('default', ['jshint', 'test']);
};
