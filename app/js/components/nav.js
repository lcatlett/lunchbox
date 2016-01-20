"use strict";

var fs = require('fs');
var Q = require('q');

/**
 * Module for loading/updating main content from files.
 */
var nav = (function() {
  var container = '';

  var menu_items = [];

  /**
   * Updates the container with given data.
   * @param  {[type]}   data     [description]
   * @param  {Function} callback [description]
   * @return {[type]}            [description]
   */
  function updateContent (data, callback) {
    if (!container) {
      callback('No container set.');
      return;
    }

    container.html(data.toString('utf8'));
    callback();
  }

  return {
    /**
     * Sets the container which will recieve loaded file content.
     * @param {[type]} selector [description]
     */
    setContainer: function (selector) {
      var el = $(selector);
      if (el) {
        container = $(selector);

        return true;
      }

      return false;
    },

    /**
     * Binds to given element's click event and loads its file.
     * @param {[type]}   el       [description]
     * @param {Function} callback [description]
     */
    addNavItem: function (el, callback) {
      var self = this;
      el = $(el);

      // track item for name-based access later on
      // if (var name = el.attr('lunchbox-name')) {
      //   menu_items.name = el;
      // }

      el.off('click');

      el.click(function (e) {
        e.preventDefault();

        self.loadFile(el.attr('href'), callback);
      });
    },

    loadByName: function (name) {
      if (typeof menu_items.name !== 'undefined') {
        menu_items.name.click();
      }
    },

    /**
     * Reads file and loads content into container.
     * @param  {[type]}   src      [description]
     * @param  {Function} callback [description]
     * @return {[type]}            [description]
     */
    loadFile: function (src, callback) {
      var self = this;
      
      if (typeof callback != 'function') {
        callback = function () {};
      }

      fs.readFile(src, function (err, data) {
        if (err) {
          callback('Could not load ' + src);
          return;
        }

        // if we loaded an html file, try to find a matching JS file
        var check_js_file = Q.defer();

        var matches = src.match(/(.+)\.html|\.htm$/);
        if (matches && matches.length == 2) {
          var js_filepath = matches[1] + '.js';
          fs.stat(js_filepath, function (error, stats) {
            if (error) {
              check_js_file.reject();
              return;
            }

            check_js_file.resolve(js_filepath);
          });
        }

        updateContent(data, function (error) {
          callback(error);

          check_js_file.promise.then(function (path) {
            self.reloadModule(path);
            self.reloadModule('common');
          }).catch(function (error) {
            self.reloadModule('common');
          });
        });
      });
    },

    /**
     * Forces file to reload by invalidating cache.
     * @param  {[type]} src [description]
     * @return {[type]}     [description]
     */
    reloadModule: function (src) {
      var path = src;

      var matches = path.match(/^\/(.+)\.js$/);
      if (!matches) {
        path = require.resolve('../' + path + '.js');
      }

      // invalidate cache
      delete require.cache[path];
      // load file
      require(path);
    }
  };
})();

module.exports = nav;