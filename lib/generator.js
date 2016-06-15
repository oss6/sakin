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

x.createIndex = function (g, customContent, cb) {
    if (g['custom_index']) {
        var content = nj.render('index.html', {
            g: g,
            content: customContent
        });

        cb({
            path: path.join('output', 'index.html'),
            url: g.root_url,
            content: content
        }, []);

        return;
    }

    // Read all articles
    reader.read('articles', 'all', (articles, errors) => {
        // Get only the metadata and url
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

x.createMenu = function (menuMapping, rootUrl, sakinFile) {
    var menuItems = [];

    Object.keys(menuMapping).forEach(name => {
        var contentsPath = menuMapping[name];
        var mappingObj = sakinFile.contents[contentsPath];
        var href = contentsPath === 'index' || mappingObj === undefined
                    ? rootUrl
                    : rootUrl + mappingObj.url;

        menuItems.push({
            name: name,
            href: href
        });
    });

    return menuItems;
};

x.generate = function (action, smart, cb) {
    // Process parameters
    // --------------------
    if (typeof action === 'boolean') {
        smart = action;
        action = {
            log: function () {}
        };
    }

    if (typeof smart === 'function') {
        cb = smart;
    }
    // --------------------

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
                    fs.removeSync(outputFile.path);
                    delete sakinFile.contents[key];

                    // Update category mappings
                    sakinFile.categories = x.updateCategoriesMapping({
                        mode: 'deleteAll',
                        mapping: sakinFile.categories,
                        articleUrl: outputFile.url
                    });
                }
            });
        }

        // Remove empty categories
        Object.keys(sakinFile.categories).forEach(category => {
            if (sakinFile.categories[category].length === 0) {
                fs.removeSync(path.join('output', 'categories', category));
                delete sakinFile.categories[category];
            }
        });

        // Read and process pages and articles
        reader.read('pages', smart ? pageFiles : 'all', (pages, pErrors) => {
            if (pErrors.length !== 0) {
                errors = errors.concat(pErrors);
            }

            reader.read('articles', smart ? articleFiles : 'all', (articles, aErrors) => {
                if (aErrors.length !== 0) {
                    errors = errors.concat(aErrors);
                }

                x.processFiles(action, sakinFile, pages, articles, (newSakinFile, processErrors) => {
                    errors = errors.concat(processErrors);

                    jsonfile.writeFile('.sakin', newSakinFile, usErr => {
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

x.processFiles = function (action, sakinFile, pages, articles, cb) {
    var processed = [];
    var customIndexContent;
    var g = utils.loadSettings(); // general context

    // Update sakin file contents
    // --------------------------------------------------
    sakinFile = x.updateSakinFile(sakinFile, pages, articles);

    // Generate menu
    // --------------------------------------------------
    g.menuItems = x.createMenu(g.menu, g.root_url, sakinFile);

    // Process pages
    // --------------------------------------------------
    g.type = 'page';
    pages.forEach(page => {
        if (page.metadata.title === 'index') {
            customIndexContent = page.content;
            return;
        }

        var pageContext = utils.extend(
            {g: g, content: page.content},
            page.metadata
        );
        var res = nj.render('page.html', pageContext);
        var mappingObj = sakinFile.contents[page.metadata.path];

        processed.push({
            path: path.join(mappingObj.path, 'index.html'),
            url: mappingObj.url,
            content: res
        });
    });

    // Process articles
    // --------------------------------------------------
    g.type = 'article';
    articles.forEach(article => {
        var articleContext = utils.extend(
            {g: g, content: article.content},
            article.metadata
        );
        var res = nj.render('article.html', articleContext);
        var mappingObj = sakinFile.contents[article.metadata.path];

        processed.push({
            path: path.join(mappingObj.path, 'index.html'),
            url: mappingObj.url,
            content: res
        });
    });

    // Generate categories pages
    // --------------------------------------------------
    g.type = 'category';
    Object.keys(sakinFile.categories).forEach(category => {
        var categoryArticles = sakinFile.categories[category];
        categoryArticles.sort((a1, a2) => utils.compareDates(a1.date, a2.date));

        var categoryContext = {
            category: category,
            articles: categoryArticles,
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
    // --------------------------------------------------
    g.type = 'index';
    x.createIndex(g, customIndexContent, (res, errors) => {
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
                cb(sakinFile, errors);
            });
        });
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

x.updateCategoriesMapping = function (o) {

    var deleteArticleFromCategory = (mapping, category, articleUrl) => {
        var idx = mapping[category].map(article => article.url).indexOf(articleUrl);
        if (idx !== -1) {
            mapping[category].splice(idx, 1);
        }

        return mapping;
    };

    var modes = {};
    modes.deleteAll = () => {
        Object.keys(o.mapping).forEach(category => {
            o.mapping = deleteArticleFromCategory(o.mapping, category, o.articleUrl);
        });
    };

    modes.addDelete = () => {
        if (o.metadata.categories === undefined) {
            return;
        }

        // Delete
        var allCategories = Object.keys(o.mapping);
        var articleCategories = o.metadata.categories;
        var diffCategories = utils.difference(allCategories, articleCategories);

        diffCategories.forEach(category => {
            o.mapping = deleteArticleFromCategory(o.mapping, category, o.articleUrl);
        });

        // Add
        o.metadata.categories.forEach(category => {
            if (o.mapping[category] === undefined) {
                o.mapping[category] = [];
            }

            // Add article (metadata + url) to the category
            if (Array.isArray(o.mapping[category])) {
                var idx = o.mapping[category]
                            .map(article => article.url)
                            .indexOf(o.articleUrl);

                if (idx === -1) {
                    o.mapping[category].push(
                        utils.extend(o.metadata, {url: o.articleUrl})
                    );
                }
            }
        });
    };

    if (modes[o.mode] !== undefined && typeof modes[o.mode] === 'function') {
        modes[o.mode]();
    }

    return o.mapping;
};

x.updateSakinFile = function (sakinFile, pages, articles) {
    pages.forEach(page => {
        var title = slug(page.metadata.title, {lower: true});
        var outputPath = path.join('output', title);
        var contentsPath = page.metadata.path;

        sakinFile.contents[contentsPath] = {}; //_path;
        sakinFile.contents[contentsPath].path = outputPath;
        sakinFile.contents[contentsPath].url = title;
    });

    articles.forEach(article => {
        if (article.metadata.categories !== undefined) {
            article.metadata.categories = utils.stringListToArray(article.metadata.categories);
        }

        var date = utils.extractISODate(article.metadata.date);
        var urlParts = [
            'blog',
            date.year,
            date.month,
            date.day,
            slug(article.metadata.title, {lower: true})
        ];
        var outputPath = path.join.apply(null, ['output'].concat(urlParts));
        var contentsPath = article.metadata.path;
        var url = urlParts.join('/');

        sakinFile.contents[contentsPath] = {}; //_path;
        sakinFile.contents[contentsPath].path = outputPath;
        sakinFile.contents[contentsPath].url = url;
        sakinFile.categories = x.updateCategoriesMapping({
            mode: 'addDelete',
            mapping: sakinFile.categories,
            articleUrl: url,
            metadata: article.metadata
        });
    });

    return sakinFile;
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
