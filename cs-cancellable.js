/**
 * csCancellable - An angular service that extends functions with a cancel() function and provides a cancel.promise to work with $http
 * @version v0.0.0
 * @link https://github.com/ChunkySamurai/csCancellable
 * @license MIT
*/
(function () {
  'use strict';

  function cancellable(func) {
    var cancelled = false;
    var ret;
    var newFunc = function () {
      if (!cancelled) {
        return func.apply(undefined, Array.prototype.slice.apply(arguments));
      } else {
        return ret;
      }
    };
    newFunc.cancel = function (returnVal) {
      if (!cancelled) {
        cancelled = true;
        handlers.forEach(function (handler) {
          handler.invoke();
        });
        ret = returnVal;
      }
    };

    var handlers = [];
    newFunc.onCancel = function (handler) {
      var wrapper = { invoke: handler };
      handlers.push(wrapper);
      return {
        dispose: function () {
          var indexOf = handlers.indexOf(wrapper);
          if (indexOf >= 0) {
            handlers.splice(indexOf, 1);
          }
        }
      };
    };
    return newFunc;
  }

  angular.module('cs.utils.cancellable', [])
  .provider('csCancellable', function () {

    // @ngInject
    this.$get = ["$q", function ($q) {
      return function (func) {
        var c = cancellable(func);
        var d = $q.defer();
        c.cancel.promise = d.promise;
        c.onCancel(function () {
          d.resolve(c);
        });
        return c;
      };
    }];
    this.$get.$inject = ["$q"];
  });

})();
