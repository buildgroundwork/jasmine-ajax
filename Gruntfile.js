module.exports = function( grunt ) {
  'use strict';

  function packageVersion() {
    return require('./package.json').version;
  }
  //
  // Grunt configuration:
  //
  // https://github.com/cowboy/grunt/blob/master/docs/getting_started.md
  //
  grunt.initConfig({
    // specifying JSHint options and globals
    // https://github.com/cowboy/grunt/blob/master/docs/task_lint.md#specifying-jshint-options-and-globals
    jshint: {
      options: { jshintrc: true },
      all: ['Gruntfile.js', 'lib/**/*.js', 'spec/**/*.js']
    },
    packageVersion: packageVersion(),
    shell: {
      ctags: {
        command: 'ctags -R lib'
      },
      release: {
        command: [
          'git tag v<%= packageVersion %>',
          'git push origin master --tags',
          'npm publish'
        ].join('&&')
      }
    },
    template: {
      options: {
        data: function() {
          return {
            packageVersion: packageVersion(),
            files: grunt.file.expand([
              'src/**/*.js',
              '!src/boot.js',
              '!src/global.js'
            ])
          };
        }
      },
      lib: {
        src: 'src/boot.js',
        dest: '.tmp/mock-ajax.js'
      }
    },
    includes: {
      options: {
        includeRegexp: /\/\/\s*include "(\S+)";/,
        includePath: '.'
      },
      lib: {
        src: '.tmp/mock-ajax.js',
        dest: 'lib/mock-ajax.js'
      }
    }
  });

  grunt.registerTask('versionCheck', function() {
    const pkgVersion = packageVersion(),
      bower = require('./bower.json'),
      bowerVersion = bower.version;

    if (pkgVersion !== bowerVersion) {
      grunt.fail.fatal("package.json and bower.json have different version numbers\n\tpackage.json:\t" + pkgVersion + "\n\tbower.json:\t" + bowerVersion);
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-template');
  grunt.loadNpmTasks('grunt-includes');
  grunt.loadNpmTasks('grunt-shell');

  grunt.registerTask('default', ['jshint']);
  grunt.registerTask('build', ['template:lib', 'includes:lib']);
  grunt.registerTask('ctags', 'Generate ctags', ['shell:ctags']);
  grunt.registerTask('release', 'Release ' + packageVersion() + ' to npm', ['versionCheck', 'shell:release']);
};

