/**
 * @file rewrite规则管理
 * @author zdying
 */

var fs = require('fs');

function Rewrite () {
  this._files = {};
  this._rules = {};
}

Rewrite.prototype = {
  constructor: Rewrite,

  /**
   * 添加rewrite配置文件
   *
   * @param {String|Array} filePath
   */
  addFile: function (filePath) {
    var _files = this._files;

    if (filePath) {
      if (!Array.isArray(filePath)) {
        filePath = [filePath];
      }

      filePath.forEach(function (file) {
        if (!(file in _files)) {
          _files[file] = {
            enable: this._initFileStatus(file)
          };
          this._watchFile(file);
        }
      }.bind(this));

      this.update();
    }
    return this;
  },

  /**
   * 删除配置文件
   *
   * @param {String|Array} filePath
   */
  deleteFile: function (filePath) {
    var _files = this._files;

    if (filePath) {
      if (!Array.isArray(filePath)) {
        filePath = [filePath];
      }

      filePath.forEach(function (file) {
        delete _files[file];
        this._unwatchFile(file);
      }.bind(this));

      this.update();
    }
    return this;
  },

  /**
   * 启用rewrite文件规则
   * @param {String|Array} filePath
   * @returns this
   */
  enableFile: function (filePath) {
    var _files = this._files;
    if (filePath) {
      if (!Array.isArray(filePath)) {
        filePath = [filePath];
      }

      filePath.forEach(function (file) {
        if (file in _files && !_files[file].enable) {
          _files[file].enable = true;
          this._watchFile(file);
          this.update();
        }
      }.bind(this));
    }
    return this;
  },

  /**
   * 禁用rewrite文件规则
   * @param {String|Array} filePath
   * @returns this
   */
  disableFile: function (filePath) {
    var _files = this._files;
    if (filePath) {
      if (!Array.isArray(filePath)) {
        filePath = [filePath];
      }

      filePath.forEach(function (file) {
        if (file in _files && _files[file].enable) {
          _files[file].enable = false;
          this._unwatchFile(file);
          this.update();
        }
      }.bind(this));
    }

    return this;
  },

  _initFileStatus: function (file) {
    // TODO
    // Get status from local file.
    return true;
  },

  _saveFileStatus: function () {
    // TODO
    // Save to local file.
    return null;
  },

  _watchFile: function (file) {
    fs.watchFile(file, { interval: 2000 }, function (curr, prev) {
      if (Date.parse(curr.ctime) === 0) {
        this.deleteFile(file);
      } else if (Date.parse(curr.mtime) !== Date.parse(prev.mtime)) {
        log.debug(file.bold.green, 'changed.');
        this.update();
      }
    }.bind(this));
  },

  _unwatchFile: function (file) {
    fs.unwatchFile(file);
  },

  /**
   * 添加规则
   */
  // addRule: function () {

  // },

  /**
   * 根据domain和location获取转发规则
   *
   * @param {String} [domain]
   */
  getRule: function (domain) {
    return domain ? this._rules[domain] : this._rules;
  },

  /**
   * 清空所有的规则
   */
  clearRules: function () {
    this._rules = {};

    return this;
  },

  /**
   * 清空所有的配置文件
   */
  // clearFiles: function () {
  //   this._files = {};

  //   return this;
  // },

  /**
   * 更新规则
   */
  update: function () {
    this.clearRules();
    var _files = this._files;
    var _rules = this._rules;
    var parsedResult;

    for (var key in _files) {
      if (!_files[key].enable) continue;

      parsedResult = Rewrite.parseFile(key);
      _files[key]['result'] = parsedResult;

      for (var domain in parsedResult.domains) {
        var rule = parsedResult.domains[domain];
        var tmp = _rules[domain];

        if (Array.isArray(tmp) && tmp.indexOf(rule) === -1) {
          tmp.push(rule);
        } else {
          _rules[domain] = [rule];
        }
      }
    }

    log.debug('rewrite updated.');
    log.detail(JSON.stringify(this._rules));

    // console.log(_files);

    return this;
  }
};

// Rewrite.parse = function (source) {

// };

Rewrite.parseFile = function (filePath) {
  var fs = require('fs');
  var AST = require('./AST');
  var formatAST = require('./ASTFormater');

  var sourceCode = fs.readFileSync(filePath);
  var ASTTree = AST(sourceCode, filePath);
  var tree = formatAST(ASTTree);

  // console.log('rewrite.parseFile', filePath, tree);

  return tree;
};

module.exports = Rewrite;
