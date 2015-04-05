module.exports = function(grunt) {

    // Load plugins

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-jsdoc');

    // Project configuration

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        meta: {
            banner:
            '/**\n' +
            ' * <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
            ' * <%= pkg.homepage %>\n' +
            ' *\n' +
            ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %> | <%= pkg.author.email %>\n' +
            ' */\n',

            prefix:
            '(function() {\n' +
            '"use strict";\n\n',

            suffix: '\n})();'
        },

        config: grunt.file.readJSON('Gruntfile.config.json'),

        clean: {
            release: {
                src: "<%= config.release_dir %>"
            },
            doc: {
                src: "<%= config.doc.dir %>"
            }
        },

        copy: {
            release_lib: {
                src: "**/*",
                dest: "<%= config.release_dir %>/src/",
                cwd: "<%= config.lib.dir.src %>/",
                expand: true
            },
            release_readme: {
                src: "README.md",
                dest: "<%= config.release_dir %>/",
                expand: true
            }
        },

        concat: {
            release: {
                options: {
                    banner: "<%= meta.banner %><%= meta.prefix %>",
                    footer: "<%= meta.suffix %>"
                },
                src: "<%= config.lib.files %>",
                dest: "<%= config.lib.files_release.normal %>"
            }
        },

        uglify: {
            options: {
                banner: '<%= meta.banner %>'
            },
            release: {
                files: {
                    '<%= config.lib.files_release.minimized %>': '<%= concat.release.dest %>'
                }
            }
        },

        karma: {
            options: {
                configFile: "karma.config.js",
                singleRun: true
            },
            build: {},
            release: {
                files: [{
                    src: [
                        "vendors/subclass.js",
                        "vendors/subclass-parameter.js",
                        "release/subclass-service.min.js",
                        "tests/plugs/app-first-plugin.js",
                        "tests/plugs/app-forth-plugin.js",
                        "tests/plugs/app-third-plugin.js",
                        "tests/plugs/app-second-plugin.js",
                        "tests/app/app.js",
                        "tests/app/**/*.js",
                        "tests/main.js",
                        "tests/*.js"
                    ]
                }]
            }
        },

        jsdoc: {
            doc: {
                src: "<%= config.doc.files %>",
                dest: "<%= config.doc.dir %>/"
            }
        }
    });

    grunt.registerTask("release", [
        "clean:release",
        "copy:release_readme",
        "concat:release",
        "uglify:release",
        "karma:release"
    ]);

    grunt.registerTask("doc", [
        "clean:doc",
        "jsdoc:doc"
    ]);

    grunt.registerTask("default", [
        "release", "doc"
    ]);

    grunt.registerMultiTask("concat", "Altering file paths", function() {
        var filesCwd = grunt.template.process("<%= config.lib.dir.src %>/");
        var files = grunt.file.expand({ cwd: filesCwd}, this.data.src);
        var content = this.data.options.banner;

        for (var i = 0; i < files.length; i++) {
            files[i] = filesCwd + files[i];
            content += grunt.file.read(files[i]);

            if (i != files.length - 1) {
                while ([";", " ", "\n"].indexOf(content[content.length - 1]) >= 0) {
                    content = content.slice(0, -1);
                }
                content += ';\n\n// Source file: ' + files[i + 1] + '\n\n';
            }
        }
        content += this.data.options.footer;
        grunt.file.write(this.data.dest, content);
    });
};