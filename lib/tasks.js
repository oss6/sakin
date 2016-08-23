'use strict';
var prompt = require('prompt');
var utils = require('./utils');
var writer = require('./writer');
var theme = require('./cli-theme');
var generator = require('./generator');
var createServer = require('./server');
var publisher = require('./publisher');
var ActionObservable = require('./action-observable');

// ..............................................
// :  tasks.js
// :
// :  It is sakin's entry point. It defines
// :  all the options used and delegates
// :  the work to the appropriate
// :  modules.
// ..............................................

var x = module.exports;

// Aliases
// ==============================================

const log = console.log;
const exit = process.exit;

// Load settings
// ==============================================

var settings;
try {
    settings = utils.loadSettings();
} catch (e) {
    settings = {
        error: e.message
    };
}

// Load action observable
// ==============================================

var action = new ActionObservable(false);

action.on('log', function (type, text) {
    console.log(theme[type](text));
});

// Private functions
// ==============================================

var clear = function () {
    log(theme.task('Clearing workspace'));

    writer.clearWorkspace(
        action,
        errors => {
            log(errors.length !== 0
                ? theme.error('An error occurred while clearing the workspace')
                : theme.success('Workspace cleared successfully')
            );
        }
    );
};

// Public API
// ==============================================

x.clear = function () {
    var schema = {
        properties: {
            answer: {
                pattern: /^y|n|yes|no$/i,
                description: 'Do you want to clear the workspace? [N|y]',
                message: 'Answer must be Y|Yes or N|No',
                required: true
            }
        }
    };

    prompt.message = '';
    prompt.start();
    prompt.get(schema, (err, result) => {
        err = null;

        result.answer = result.answer.toLowerCase();
        if (result.answer === 'y' || result.answer === 'yes') {
            clear();
        }
    });
};

x.createItem = function (type, name) {
    writer.createFile(
        name,
        type,
        err => {
            log(err
                ? theme.error(`Could not create the ${type}`)
                : theme.success(`${utils.titleCase(type)} created successfully`)
            );
        }
    );
};

x.generate = function (smartGeneration) {
    log(theme.task('Generating site'));

    generator.generate(
        action,
        smartGeneration,
        errors => {
            log(errors.length !== 0
                ? theme.error('Could not generate the site')
                : theme.success('Site generated successfully')
            );
        }
    );
};

x.index = function () {
    x.createItem('page', 'index');
};

x.publish = function () {
    publisher.publish(settings.publish, error => {
        if (error !== null) {
            log(theme.error(error));
        }
    });
};

x.serve = function (port) {
    var server = createServer('output');
    var watcher = generator.watchChanges(action, 'contents');

    process.on('SIGINT', () => {
        watcher.close();
        exit();
    });

    log(theme.task('Previewing site at localhost:' + port));
    server.listen(Number(port));
};

x.run = function (program) {
    // On/off options
    // --------------------------------------------------
    var smartGeneration = utils.chooseOption(
        [program.onSmart, true],
        [program.offSmart, false],
        settings['smart_generation']
    );

    // Option processiong
    // --------------------------------------------------
    if (program.clear) {
        x.clear();
    } else if (program.article || program.page) {
        x.createItem.apply(null, program.article ? ['article', program.article] : ['page', program.page]);
    } else if (program.generate) {
        x.generate(smartGeneration);
    } else if (program.index) {
        x.index();
    } else if (program.publish) {
        x.publish();
    } else if (program.serve) {
        x.serve(typeof program.serve === 'boolean' ? '8000' : program.serve);
    }
};
