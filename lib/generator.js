'use strict';
var path = require('path');
var slug = require('slug');
var fs = require('fs-extra');
var nj = require('nunjucks');
var utils = require('./utils');
var git = require('simple-git');
var writer = require('./writer');
var reader = require('./reader');
var chokidar = require('chokidar');
var jsonfile = require('jsonfile');

// ..............................................
// :  generator.js
// :
// :  Provides functionality to generate the
// :  website from the given content, the
// :  static assets and the templates
// ..............................................

var x = module.exports;
var contentsRepo = git('contents');

x.getModifiedFiles = function (repo, cb) {
    repo.add('.', () => {
        repo.status((err, status) => {
            var pageFiles = [];
            var articleFiles = [];
            var deleted = [];

            if (!err) {
                // Get modified + created
                var all = status.modified.concat(status.created);
                deleted = status.deleted;

                all.forEach(file => {
                    var parts = file.split(path.sep);
                    var type = parts[0];
                    var fileName = parts[1];

                    if (type === 'pages') {
                        pageFiles.push(fileName);
                    } else if (type === 'articles') {
                        articleFiles.push(fileName);
                    }
                });
            }

            cb(err, pageFiles, articleFiles, deleted);
        });
    });
};

x.createIndex = function (g, cb) { // articles
    reader.read('articles', 'all', (articles, errors) => {
        articles = articles.map(article => {
            var date = utils.extractISODate(article.metadata.date);
            var urlParts = [
                'blog',
                date.year,
                date.month,
                date.day,
                slug(article.metadata.title, {lower: true})
            ];

            return utils.extend(article.metadata, {
                url: g.root_url + urlParts.join('/')
            });
        });

        articles.sort((a1, a2) => utils.compareDates(a1.date, a2.date));

        var res = nj.render('index.html', {
            g: g,
            articles: articles
        });

        cb({
            path: path.join('output', 'index.html'),
            url: g.root_url,
            content: res
        }, errors);
    });
};

x.transferStatic = function (action, cb) {
    var staticPath = 'static';
    var errors = [];

    fs.readdir(staticPath, (err, files) => {
        if (err) {
            errors.push(err);
            return;
        }

        var toGo = files.length;

        files
            .map(file => path.join(staticPath, file))
            .forEach(file => {
                var p = path.join('output', path.basename(file));

                fs.copy(file, p, copyErr => {
                    if (err) {
                        action.log('error', file + ' -> ' + p);
                        errors.push(copyErr);
                    } else if (--toGo === 0) {
                        cb(errors);
                    } else {
                        action.log('success', file + ' -> ' + p);
                    }
                });
            });
    });
};

x.processFiles = function (action, pages, articles, cb) {
    var contentsMapping = {};
    var categoriesMapping = {};
    var processed = [];
    var g = utils.loadSettings(); // general context

    // Process pages
    g.type = 'page';
    pages.forEach(page => {
        var pageContext = utils.extend(
            {g: g, content: page.content},
            page.metadata
        );
        var res = nj.render('page.html', pageContext);
        var title = slug(page.metadata.title, {lower: true});
        var _path = path.join('output', title);

        // Update mappings (to save later in .sakin file)
        contentsMapping[page.metadata.path] = _path;

        processed.push({
            path: path.join(_path, 'index.html'),
            url: title,
            content: res
        });
    });

    // Process articles
    g.type = 'article';
    articles.forEach(article => {
        if (article.metadata.categories !== undefined) {
            article.metadata.categories = utils.stringListToArray(article.metadata.categories);
        }

        var articleContext = utils.extend(
            {g: g, content: article.content},
            article.metadata
        );
        var res = nj.render('article.html', articleContext);
        var date = utils.extractISODate(article.metadata.date);
        var urlParts = [
            'blog',
            date.year,
            date.month,
            date.day,
            slug(article.metadata.title, {lower: true})
        ];
        var _path = path.join.apply(null, ['.', 'output'].concat(urlParts));
        var _url = urlParts.join('/');

        // Update mappings (to save later in .sakin file)
        contentsMapping[article.metadata.path] = _path;
        categoriesMapping = x.updateCategoriesMapping(
            'add',
            categoriesMapping,
            _url,
            article.metadata
        );

        processed.push({
            path: path.join(_path, 'index.html'),
            url: _url,
            content: res
        });
    });

    // Generate categories pages
    g.type = 'category';
    Object.keys(categoriesMapping).forEach(category => {
        var articles = categoriesMapping[category];
        articles.sort((a1, a2) => utils.compareDates(a1.date, a2.date));

        var categoryContext = {
            category: category,
            articles: articles,
            g: g
        };
        var res = nj.render('category.html', categoryContext);
        var _path = path.join('output', 'categories', category, 'index.html');
        var _url = `categories/${category}`;

        processed.push({
            path: _path,
            url: _url,
            content: res
        });
    });

    // Generate index.html
    g.type = 'index';
    x.createIndex(g, (res, errors) => {
        if (errors.length === 0) {
            processed.push(res);
        }

        // Send processed files to output
        writer.saveToOutput(action, processed, saveErrors => {
            if (saveErrors.length !== 0) {
                errors.concat(saveErrors);
            }

            // Commit changes
            contentsRepo.commit(`Contents updated at ${utils.getDate()}`);

            // Transfer static
            x.transferStatic(action, transferErrors => {
                if (transferErrors.length !== 0) {
                    errors.concat(transferErrors);
                }
                cb(contentsMapping, categoriesMapping, errors);
            });
        });
    });
};

x.updateSakinFile = function (contentsMapping, categoriesMapping, sakinFile, cb) {
    var currentContentsMapping = sakinFile.contents;
    var newContentsMapping = utils.extend(currentContentsMapping, contentsMapping);

    var currentCategoriesMapping = sakinFile.categories;
    var newCategoriesMapping = utils.extend(currentCategoriesMapping, categoriesMapping);

    sakinFile.contents = newContentsMapping;
    sakinFile.categories = newCategoriesMapping;

    jsonfile.writeFile('.sakin', sakinFile, cb);
};

x.generate = function (action, smart, cb) {
    if (typeof action === 'boolean') {
        smart = action;
        action = {
            log: function () {}
        };
    }

    if (typeof smart === 'function') {
        cb = smart;
    }

    var errors = [];

    // Configure template engine
    var env = nj.configure('templates', { autoescape: true });
    env.addFilter('human_date', utils.humanDate);

    x.getModifiedFiles(contentsRepo, (err, pageFiles, articleFiles, deletedFiles) => {
        // Get sakin file contents
        var sakinFile = jsonfile.readFileSync('.sakin');

        // Delete output files if necessary
        if (deletedFiles.length !== 0) {
            deletedFiles.forEach(contentFile => {
                var key = path.join('contents', contentFile);
                var outputFile = sakinFile.contents[key];

                if (outputFile !== undefined) {
                    // Remove file and update contents mapping
                    fs.removeSync(outputFile);
                    delete sakinFile.contents[key];

                    // Update category mappings
                    var urlParts = outputFile.split('/');
                    urlParts.shift();
                    var url = urlParts.join('/');
                    sakinFile.categories = x.updateCategoriesMapping('delete', sakinFile.categories, url);
                }
            });
        }

        // Read and process pages and articles
        reader.read('pages', smart ? pageFiles : 'all', (pages, pErrors) => {
            if (pErrors.length !== 0) {
                errors = errors.concat(pErrors);
            }

            reader.read('articles', smart ? articleFiles : 'all', (articles, aErrors) => {
                if (aErrors.length !== 0) {
                    errors = errors.concat(aErrors);
                }

                x.processFiles(action, pages, articles, (contentsMapping, categoriesMapping, processErrors) => {
                    errors = errors.concat(processErrors);

                    x.updateSakinFile(contentsMapping, categoriesMapping, sakinFile, usErr => {
                        if (usErr) {
                            errors.push(usErr);
                        }
                        if (cb !== undefined && typeof cb === 'function') {
                            cb(errors);
                        }
                    });
                });
            });
        });
    });
};

x.updateCategoriesMapping = function (mode, mapping, articleUrl, metadata) {
    var modes = {};
    modes.add = () => {
        if (metadata.categories === undefined) {
            return;
        }

        metadata.categories.forEach(category => {
            if (mapping[category] === undefined) {
                mapping[category] = [];
            }

            // Add article (metadata + url) to the category
            if (Array.isArray(mapping[category])) {
                mapping[category].push(
                    utils.extend(metadata, {url: articleUrl})
                );
            }
        });
    };

    modes.delete = () => {
        Object.keys(mapping).forEach(category => {
            var idx = mapping[category].map(article => article.url).indexOf(articleUrl);
            if (idx > -1) {
                mapping[category].splice(idx, 1);
            }
        });
    };

    if (modes[mode] !== undefined && typeof modes[mode] === 'function') {
        modes[mode]();
    }

    return mapping;
};

x.watchChanges = function (action, directory) {
    var watcher = chokidar.watch(directory, {
        ignoreInitial: true,
        ignored: /[\/\\]\./,
        awaitWriteFinish: true
    });

    var events = {
        add: 'added',
        change: 'modified',
        unlink: 'deleted'
    };

    var callback = event => {
        return p => {
            action.log('success', p + ' has been ' + events[event]);
            x.generate(true);
        };
    };

    // Add events to watcher
    Object.keys(events).forEach(event => {
        watcher.on(event, callback(event));
    });

    watcher.on('error', () => {
        action.log('error', 'An error occurred while watching ' +
            'changes in the contents directory');
    });

    return watcher;
};
