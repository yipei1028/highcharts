/*
 * Copyright (C) Highsoft AS
 */

const gulp = require('gulp');

/* *
 *
 *  Constants
 *
 * */

const WATCH_GLOBS = [
    'js/**/*.js'
];

/* *
 *
 *  Tasks
 *
 * */

/**
 * Continuesly watching sources to restart the `scripts-js` task.
 *
 * @return {Promise<void>}
 *         Promise to keep
 */
function task() {

    const argv = require('yargs').argv;
    const fsLib = require('./lib/fs');
    const logLib = require('./lib/log');
    const processLib = require('./lib/process');

    if (processLib.isRunning('scripts-watch')) {
        logLib.warn('Running watch process detected.');
        if (!argv.force) {
            logLib.warn('Skipping task...');
            return Promise.resolve();
        }
    }

    let jsHash;

    gulp
        .watch(WATCH_GLOBS, done => {

            const buildTasks = [];
            const newJsHash = fsLib.getDirectoryHash('js', true);

            if (newJsHash !== jsHash) {
                jsHash = newJsHash;
                buildTasks.push('scripts-js');
            }

            if (buildTasks.length === 0) {
                logLib.success('No significant changes found.');
                done();
                return;
            }

            gulp.series(...buildTasks)(done);
        })
        .on('add', filePath => logLib.warn('Modified', filePath))
        .on('change', filePath => logLib.warn('Modified', filePath))
        .on('unlink', filePath => logLib.warn('Modified', filePath))
        .on('error', logLib.failure);

    logLib.warn('Watching [', WATCH_GLOBS.join(', '), '] ...');

    processLib.isRunning('scripts-watch', true);

    processLib.exec('npx tsc --build ts --watch');

    return Promise.resolve();
}

require('./scripts-css.js');
require('./scripts-js.js');
require('./scripts-ts.js');

gulp.task(
    'scripts-watch',
    gulp.series('scripts-ts', 'scripts-css', 'scripts-js', task)
);
