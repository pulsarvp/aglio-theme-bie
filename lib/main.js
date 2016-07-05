(function() {
  var ROOT, benchmark, compileTemplate, copyFile, copyFiles, crypto, decorate, errMsg, fs, getCss, getFont, getImg, getJs, getTemplate, highlight, hljs, jade, less, markdownIt, modifyUriTemplate, moment, path, querystring, renderExample, renderSchema, sha1, slug;

  crypto = require('crypto');

  fs = require('fs');

  hljs = require('highlight.js');

  jade = require('jade');

  less = require('less');

  markdownIt = require('markdown-it');

  moment = require('moment');

  path = require('path');

  querystring = require('querystring');

  renderExample = require('./example');

  renderSchema = require('./schema');

  ROOT = path.dirname(__dirname);

  benchmark = {
    start: function(message) {
      if (process.env.BENCHMARK) {
        return console.time(message);
      }
    },
    end: function(message) {
      if (process.env.BENCHMARK) {
        return console.timeEnd(message);
      }
    }
  };

  errMsg = function(message, err) {
    err.message = message + ": " + err.message;
    return err;
  };

  sha1 = function(value) {
    return crypto.createHash('sha1').update(value.toString()).digest('hex');
  };

  slug = function(arg, value, unique) {
    var sluggified;
    arg;
    if (value == null) {
      value = '';
    }
    if (unique == null) {
      unique = false;
    }
    sluggified = value.toLowerCase().replace(/[ \t\n\\<>"'=:\/]/g, '-').replace(/-+/g, '-').replace(/^-/, '');
    return sluggified;
  };

  highlight = function(code, lang, subset) {
    var response;
    benchmark.start("highlight " + lang);
    response = (function() {
      switch (lang) {
        case 'no-highlight':
          return code;
        case void 0:
        case null:
        case '':
          return hljs.highlightAuto(code, subset).value;
        default:
          return hljs.highlight(lang, code).value;
      }
    })();
    benchmark.end("highlight " + lang);
    return response.trim();
  };

  copyFile = function(from, to) {
    return fs.createReadStream(from).pipe(fs.createWriteStream(to));
  };

  copyFiles = function(fromDir, toDir) {
    var f, i, len, list;
    list = fs.readdirSync(fromDir);
    for (i = 0, len = list.length; i < len; i++) {
      f = list[i];
      fs.createReadStream(path.join(fromDir, f)).pipe(fs.createWriteStream(path.join(toDir, f)));
    }
    return true;
  };

  getCss = function(dest, verbose, done) {
    var from, s, to;
    dest = path.join(dest, 'css');
    if (!fs.existsSync(dest)) {
      fs.mkdir(dest, 0x1ed);
    }
    to = path.join(dest, "app.min.css");
    from = path.join(ROOT, 'less', 'app.less');
    s = "@import \"" + from + "\";\n";
    if (verbose) {
      console.log('Generating CSS...');
    }
    benchmark.start('less-compile');
    return less.render(s, {
      paths: ['node_modules'],
      compress: true,
      cleancss: true,
      "yuicompress": true,
      "optimization": 2
    }, function(err, result) {
      var css, error, writeErr;
      if (err) {
        return done(errMsg('Error processing LESS -> CSS', err));
      }
      try {
        css = result.css;
        fs.writeFileSync(to, css, 'utf-8');
      } catch (error) {
        writeErr = error;
        return done(errMsg('Error writing CSS to file', writeErr));
      }
      benchmark.end('less-compile');
      return done(null, css);
    });
  };

  getFont = function(dest, verbose, done) {
    var error, from;
    dest = path.join(dest, 'font');
    if (!fs.existsSync(dest)) {
      fs.mkdir(dest, 0x1ed);
    }
    dest = path.join(dest, 'fontawesome');
    if (!fs.existsSync(dest)) {
      fs.mkdir(dest, 0x1ed);
    }
    if (verbose) {
      console.log('Copying font files...');
    }
    from = path.join(ROOT, '..', 'font-awesome/fonts');
    try {
      copyFiles(from, dest);
    } catch (error) {
      return done('Error copying font files');
    }
    return done(null);
  };

  getImg = function(dest, verbose, done) {
    var error, from;
    dest = path.join(dest, 'img');
    if (!fs.existsSync(dest)) {
      fs.mkdir(dest, 0x1ed);
    }
    if (verbose) {
      console.log('Copying image files...');
    }
    from = path.join(ROOT, 'img');
    try {
      copyFiles(from, dest);
    } catch (error) {
      return done('Error copying image files');
    }
    return done(null);
  };

  getJs = function(dest, verbose, done) {
    var error;
    dest = path.join(dest, 'js');
    if (!fs.existsSync(dest)) {
      fs.mkdir(dest, 0x1ed);
    }
    if (verbose) {
      console.log('Copying JS files...');
    }
    try {
      copyFile(path.join(ROOT, '..', 'jquery/dist/jquery.min.js'), path.join(dest, 'jquery.min.js'));
      copyFile(path.join(ROOT, '..', 'bootstrap/dist/js/bootstrap.min.js'), path.join(dest, 'bootstrap.min.js'));
    } catch (error) {
      return done('Error copying JS files');
    }
    return done(null);
  };

  compileTemplate = function(filename, options) {
    var compiled;
    return compiled = "var jade = require('jade/runtime');\n" + (jade.compileFileClient(filename, options)) + "\nmodule.exports = compiledFunc;";
  };

  getTemplate = function(name, verbose, done) {
    var builtin, compileErr, compileOptions, compiled, compiledPath, dest, error, error1, error2, load, writeErr;
    builtin = path.join(ROOT, 'templates', name + ".jade");
    if (!fs.existsSync(name) && fs.existsSync(builtin)) {
      name = builtin;
    }
    dest = path.join(ROOT, 'js');
    if (!fs.existsSync(dest)) {
      fs.mkdir(dest, 0x1ed);
    }
    compiledPath = path.join(dest, 'app.js');
    load = function(filename, loadDone) {
      var error, loadErr, loaded;
      try {
        loaded = require(filename);
      } catch (error) {
        loadErr = error;
        return loadDone(errMsg('Unable to load template', loadErr));
      }
      return loadDone(null, require(filename));
    };
    if (verbose) {
      console.log("Using template " + name);
    }
    if (verbose) {
      console.log('Generating template JS...');
    }
    benchmark.start('jade-compile');
    compileOptions = {
      filename: name,
      name: 'compiledFunc',
      self: true,
      compileDebug: false
    };
    try {
      compiled = compileTemplate(name, compileOptions);
    } catch (error) {
      compileErr = error;
      return done(errMsg('Error compiling template', compileErr));
    }
    if (compiled.indexOf('self.') === -1) {
      compileOptions.self = false;
      try {
        compiled = compileTemplate(name, compileOptions);
      } catch (error1) {
        compileErr = error1;
        return done(errMsg('Error compiling template', compileErr));
      }
    }
    try {
      fs.writeFileSync(compiledPath, compiled, 'utf-8');
    } catch (error2) {
      writeErr = error2;
      return done(errMsg('Error writing template file', writeErr));
    }
    benchmark.end('jade-compile');
    return done(null, require(compiledPath));
  };

  modifyUriTemplate = function(templateUri, parameters, colorize) {
    var block, closeIndex, index, lastIndex, param, parameterBlocks, parameterNames, parameterSet, parameterValidator;
    parameterValidator = function(b) {
      return parameterNames.indexOf(querystring.unescape(b.replace(/^\*|\*$/, ''))) !== -1;
    };
    parameterNames = (function() {
      var i, len, results;
      results = [];
      for (i = 0, len = parameters.length; i < len; i++) {
        param = parameters[i];
        results.push(param.name);
      }
      return results;
    })();
    parameterBlocks = [];
    lastIndex = index = 0;
    while ((index = templateUri.indexOf("{", index)) !== -1) {
      parameterBlocks.push(templateUri.substring(lastIndex, index));
      block = {};
      closeIndex = templateUri.indexOf("}", index);
      block.querySet = templateUri.indexOf("{?", index) === index;
      block.formSet = templateUri.indexOf("{&", index) === index;
      block.reservedSet = templateUri.indexOf("{+", index) === index;
      lastIndex = closeIndex + 1;
      index++;
      if (block.querySet || block.formSet || block.reservedSet) {
        index++;
      }
      parameterSet = templateUri.substring(index, closeIndex);
      block.parameters = parameterSet.split(",").filter(parameterValidator);
      if (block.parameters.length) {
        parameterBlocks.push(block);
      }
    }
    parameterBlocks.push(templateUri.substring(lastIndex, templateUri.length));
    return parameterBlocks.reduce(function(uri, v) {
      var segment;
      if (typeof v === "string") {
        uri.push(v);
      } else {
        segment = !colorize ? ["{"] : [];
        if (v.querySet) {
          segment.push("?");
        }
        if (v.formSet) {
          segment.push("&");
        }
        if (v.reservedSet && !colorize) {
          segment.push("+");
        }
        segment.push(v.parameters.map(function(name) {
          if (!colorize) {
            return name;
          } else {
            name = name.replace(/^\*|\*$/, '');
            param = parameters[parameterNames.indexOf(querystring.unescape(name))];
            if (v.querySet || v.formSet) {
              return ("<span class=\"hljs-attribute\">" + name + "=</span>") + ("<span class=\"hljs-literal\">" + (param.example || '') + "</span>");
            } else {
              return "<span class=\"hljs-attribute\" title=\"" + name + "\">" + (param.example || name) + "</span>";
            }
          }
        }).join(colorize ? '&' : ','));
        if (!colorize) {
          segment.push("}");
        }
        uri.push(segment.join(""));
      }
      return uri;
    }, []).join('').replace(/\/+/g, '/');
  };

  decorate = function(api, md, slugCache, verbose) {
    var action, category, dataStructure, dataStructures, err, example, i, item, j, k, knownParams, l, len, len1, len2, len3, meta, name, newParams, param, ref, ref1, ref2, ref3, resource, resourceGroup, results, reversed, slugify;
    slugify = slug.bind(slug, slugCache);
    dataStructures = {};
    ref = api.content || [];
    for (i = 0, len = ref.length; i < len; i++) {
      category = ref[i];
      ref1 = category.content || [];
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        item = ref1[j];
        if (item.element === 'dataStructure') {
          dataStructure = item.content[0];
          dataStructures[dataStructure.meta.id] = dataStructure;
        }
      }
    }
    if (verbose) {
      console.log("Known data structures: " + (Object.keys(dataStructures)));
    }
    if (api.description) {
      api.descriptionHtml = md.render(api.description);
      api.navItems = slugCache._nav;
      slugCache._nav = [];
    }
    ref2 = api.metadata || [];
    for (k = 0, len2 = ref2.length; k < len2; k++) {
      meta = ref2[k];
      if (meta.name === 'HOST') {
        api.host = meta.value;
      }
    }
    ref3 = api.resourceGroups || [];
    results = [];
    for (l = 0, len3 = ref3.length; l < len3; l++) {
      resourceGroup = ref3[l];
      resourceGroup.elementId = slugify(resourceGroup.name, true);
      resourceGroup.elementLink = "#" + resourceGroup.elementId;
      if (resourceGroup.description) {
        resourceGroup.descriptionHtml = md.render(resourceGroup.description);
        resourceGroup.navItems = slugCache._nav;
        slugCache._nav = [];
      }
      results.push((function() {
        var len4, m, ref4, results1;
        ref4 = resourceGroup.resources || [];
        results1 = [];
        for (m = 0, len4 = ref4.length; m < len4; m++) {
          resource = ref4[m];
          resource.elementId = slugify(resourceGroup.name + "-" + resource.name, true);
          resource.elementLink = "#" + resource.elementId;
          results1.push((function() {
            var len5, len6, n, o, ref5, results2;
            ref5 = resource.actions || [];
            results2 = [];
            for (n = 0, len5 = ref5.length; n < len5; n++) {
              action = ref5[n];
              action.elementId = slugify(resourceGroup.name + "-" + resource.name + "-" + action.method, true);
              action.elementLink = "#" + action.elementId;
              action.methodLower = action.method.toLowerCase();
              if (!(action.attributes || {}).uriTemplate) {
                if (!action.parameters || !action.parameters.length) {
                  action.parameters = resource.parameters;
                } else if (resource.parameters) {
                  action.parameters = resource.parameters.concat(action.parameters);
                }
              }
              knownParams = {};
              newParams = [];
              reversed = (action.parameters || []).concat([]).reverse();
              for (o = 0, len6 = reversed.length; o < len6; o++) {
                param = reversed[o];
                if (knownParams[param.name]) {
                  continue;
                }
                knownParams[param.name] = true;
                newParams.push(param);
              }
              action.parameters = newParams.reverse();
              action.uriTemplate = modifyUriTemplate((action.attributes || {}).uriTemplate || resource.uriTemplate || '', action.parameters);
              action.colorizedUriTemplate = modifyUriTemplate((action.attributes || {}).uriTemplate || resource.uriTemplate || '', action.parameters, true);
              action.hasRequest = false;
              results2.push((function() {
                var len7, p, ref6, results3;
                ref6 = action.examples || [];
                results3 = [];
                for (p = 0, len7 = ref6.length; p < len7; p++) {
                  example = ref6[p];
                  results3.push((function() {
                    var len8, q, ref7, results4;
                    ref7 = ['requests', 'responses'];
                    results4 = [];
                    for (q = 0, len8 = ref7.length; q < len8; q++) {
                      name = ref7[q];
                      results4.push((function() {
                        var error, error1, error2, len10, len11, len9, r, ref10, ref8, ref9, results5, t, u;
                        ref8 = example[name] || [];
                        results5 = [];
                        for (r = 0, len9 = ref8.length; r < len9; r++) {
                          item = ref8[r];
                          if (name === 'requests' && !action.hasRequest) {
                            action.hasRequest = true;
                          }
                          if (item.content) {
                            ref9 = item.content;
                            for (t = 0, len10 = ref9.length; t < len10; t++) {
                              dataStructure = ref9[t];
                              if (dataStructure.element === 'dataStructure') {
                                try {
                                  item.schemaStructure = renderSchema(dataStructure.content[0], dataStructures);
                                } catch (error) {
                                  err = error;
                                  if (verbose) {
                                    console.log(JSON.stringify(dataStructure.content[0], null, 2));
                                    console.log(err);
                                  }
                                }
                              }
                            }
                          }
                          if (item.content && !process.env.DRAFTER_EXAMPLES) {
                            ref10 = item.content;
                            for (u = 0, len11 = ref10.length; u < len11; u++) {
                              dataStructure = ref10[u];
                              if (dataStructure.element === 'dataStructure') {
                                try {
                                  item.body = JSON.stringify(renderExample(dataStructure.content[0], dataStructures), null, 2);
                                } catch (error1) {
                                  err = error1;
                                  if (verbose) {
                                    console.log(JSON.stringify(dataStructure.content[0], null, 2));
                                    console.log(err);
                                  }
                                }
                              }
                            }
                          }
                          item.hasContent = item.description || Object.keys(item.headers).length || item.body || item.schema;
                          try {
                            if (item.body) {
                              item.body = JSON.stringify(JSON.parse(item.body), null, 2);
                            }
                            if (item.schema) {
                              results5.push(item.schema = JSON.stringify(JSON.parse(item.schema), null, 2));
                            } else {
                              results5.push(void 0);
                            }
                          } catch (error2) {
                            err = error2;
                            results5.push(false);
                          }
                        }
                        return results5;
                      })());
                    }
                    return results4;
                  })());
                }
                return results3;
              })());
            }
            return results2;
          })());
        }
        return results1;
      })());
    }
    return results;
  };

  exports.getConfig = function() {
    return {
      formats: ['1A'],
      options: [
        {
          name: 'variables',
          description: 'Color scheme name or path to custom variables',
          "default": 'default'
        }, {
          name: 'condense-nav',
          description: 'Condense navigation links',
          boolean: true,
          "default": true
        }, {
          name: 'full-width',
          description: 'Use full window width',
          boolean: true,
          "default": false
        }, {
          name: 'template',
          description: 'Template name or path to custom template',
          "default": 'default'
        }, {
          name: 'style',
          description: 'Layout style name or path to custom stylesheet'
        }, {
          name: 'emoji',
          description: 'Enable support for emoticons',
          boolean: true,
          "default": true
        }
      ]
    };
  };

  exports.render = function(input, options, done) {
    var md, slugCache, themeStyle, themeVariables, verbose;
    if (done == null) {
      done = options;
      options = {};
    }
    if (options.condenseNav) {
      options.themeCondenseNav = options.condenseNav;
    }
    if (options.fullWidth) {
      options.themeFullWidth = options.fullWidth;
    }
    if (options.themeVariables == null) {
      options.themeVariables = 'default';
    }
    if (options.themeStyle == null) {
      options.themeStyle = 'default';
    }
    if (options.themeTemplate == null) {
      options.themeTemplate = 'default';
    }
    if (options.themeCondenseNav == null) {
      options.themeCondenseNav = true;
    }
    if (options.themeFullWidth == null) {
      options.themeFullWidth = false;
    }
    if (options.themeDest == null) {
      options.themeDest = 'out';
    }
    if (options.themeTemplate === 'default') {
      options.themeTemplate = path.join(ROOT, 'templates', 'index.jade');
    }
    if (!path.isAbsolute(options.themeDest)) {
      options.themeDest = path.normalize(path.join(ROOT, '../..', options.themeDest));
    }
    slugCache = {
      _nav: []
    };
    md = markdownIt({
      html: true,
      linkify: true,
      typographer: true,
      highlight: highlight
    }).use(require('markdown-it-anchor'), {
      slugify: function(value) {
        var output;
        output = "header-" + (slug(slugCache, value, true));
        slugCache._nav.push([value, "#" + output]);
        return output;
      },
      permalink: true,
      permalinkClass: 'permalink'
    }).use(require('markdown-it-checkbox')).use(require('markdown-it-container'), 'note').use(require('markdown-it-container'), 'warning');
    if (options.themeEmoji) {
      md.use(require('markdown-it-emoji'));
    }
    md.renderer.rules.code_block = md.renderer.rules.fence;
    benchmark.start('decorate');
    decorate(input, md, slugCache, options.verbose);
    benchmark.end('decorate');
    benchmark.start('css-total');
    themeVariables = options.themeVariables, themeStyle = options.themeStyle, verbose = options.verbose;
    if (!fs.existsSync(options.themeDest)) {
      fs.mkdir(options.themeDest, 0x1ed);
    }
    return getFont(options.themeDest, verbose, function(err, css) {
      if (err) {
        return done(errMsg('Could not proccess Font-Awesome', err));
      }
      return getJs(options.themeDest, verbose, function(err, css) {
        if (err) {
          return done(errMsg('Could not proccess JS files', err));
        }
        return getImg(options.themeDest, verbose, function(err, css) {
          if (err) {
            return done(errMsg('Could not proccess images', err));
          }
          return getCss(options.themeDest, verbose, function(err, css) {
            var key, locals, ref, value;
            if (err) {
              return done(errMsg('Could not get CSS', err));
            }
            benchmark.end('css-total');
            locals = {
              api: input,
              condenseNav: options.themeCondenseNav,
              css: css,
              fullWidth: options.themeFullWidth,
              date: moment,
              hash: function(value) {
                return crypto.createHash('md5').update(value.toString()).digest('hex');
              },
              highlight: highlight,
              markdown: function(content) {
                return md.render(content);
              },
              slug: slug.bind(slug, slugCache),
              urldec: function(value) {
                return querystring.unescape(value);
              }
            };
            ref = options.locals || {};
            for (key in ref) {
              value = ref[key];
              locals[key] = value;
            }
            benchmark.start('get-template');
            return getTemplate(options.themeTemplate, verbose, function(getTemplateErr, renderer) {
              var error, html;
              if (getTemplateErr) {
                return done(errMsg('Could not get template', getTemplateErr));
              }
              benchmark.end('get-template');
              benchmark.start('call-template');
              try {
                html = renderer(locals);
              } catch (error) {
                err = error;
                return done(errMsg('Error calling template during rendering', err));
              }
              benchmark.end('call-template');
              return done(null, html);
            });
          });
        });
      });
    });
  };

}).call(this);
