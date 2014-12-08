if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      // closest thing possible to the ECMAScript 5 internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }

    var aArgs = Array.prototype.slice.call(arguments, 1),
    fToBind = this,
    fNOP = function () {},
    fBound = function () {
      return fToBind.apply(this instanceof fNOP && oThis
        ? this
        : oThis,
        aArgs.concat(Array.prototype.slice.call(arguments)));
    };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}

chai.use(chaiAsPromised);
var expect = chai.expect;
var $httpBackendCalled;

angular.module('test', ['ngMock']).config(function ($provide, $httpBackend) {
  $provide.decorator('$httpBackend', function ($delegate) {
    var proxy = function (method, url, data, callback, headers) {
      var interceptor = function () {
        var _this = this;
        var _arguments = arguments;
        setTimeout(function () {
          $httpBackendCalled.resolve();
          callback.apply(_this, _arguments);
        }, 3000);
      };
      return $delegate.call(this, method, url, data, interceptor, headers);
    };
    for(var key in $delegate) {
      proxy[key] = $delegate[key];
    }
    return proxy;
  });

  $httpBackend.when('GET', 'dummy')
    .respond('dummy result');
});

function inject (fn) {
  return function() {
    angular.injector(['ng', 'ngMock', 'cs.utils.cancellable']).invoke(fn);
  }
}

describe('csCancellable', function () {
  var $http;
  var $q;
  var csCancellable;
  function update(new_$http, new_$q, new_csCancellable) {
    $http = new_$http;
    $q = new_$q;
    csCancellable = new_csCancellable;
    $httpBackendCalled = $q.defer();
  }

  beforeEach(inject(function ($http, $q, csCancellable) {
    update($http, $q, csCancellable);
  }));

  it('should call the original function', function () {
    var called = false;
    var func = csCancellable(function () {
      called = true;
    });

    func();

    expect(called).to.be.true;
  });

  it('should not call the original function if cancelled', function () {
    var called = false;
    var func = csCancellable(function () {
      called = true;
    });

    func.cancel();
    func();

    expect(called).to.be.false;
  });

  it('should resolve the cancel promise when cancelled', function () {
    var func = csCancellable(function () {});
    func.cancel();
    func();

    expect(func.cancel.promise).to.be.fulfilled;
  });

  it('should allow http calls when promise is used as a timeout', function () {
    var result = $q.defer();
    var func = csCancellable(function (data) {
      result.resolve(data);
    });

    $http.get('dummy', { timeout: func.cancel.promise }).then(func);

    expect(result.promise).to.eventually.equal('dummy result');
    expect($httpBackendCalled.promise).to.be.fulfilled;
  });

  it('should prevent http calls when promise is used as a timeout and the function is cancelled', function () {
    var result = $q.defer();
    var func = csCancellable(function (data) {
      result.resolve(data);
    });

    func.cancel();
    $http.get('dummy', { timeout: func.cancel.promise }).then(func).catch(function () {
      result.reject();
    });

    expect(result.promise).to.be.rejected;
    expect($httpBackendCalled.promise).to.be.fulfilled;
  });

  it('should cancel http calls when promise is used as a timeout and the function is cancelled', function () {
    var result = $q.defer();
    var func = csCancellable(function (data) {
      result.resolve(data);
    });

    $http.get('dummy', { timeout: func.cancel.promise }).then(func).catch(function () {
      result.reject();
    });
    func.cancel();

    expect(result.promise).to.eventually.equal(null);
    expect($httpBackendCalled.promise).to.not.be.fulfilled;
  });

})
