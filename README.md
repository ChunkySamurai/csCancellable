csCancellable [![Build Status](https://travis-ci.org/ChunkySamurai/csCancellable.svg)](https://travis-ci.org/ChunkySamurai/csCancellable)
-------------

###Description
An angular service that extends functions with a cancel() function and provides a cancel.promise to work with $http.

###Usage
```js
angular.module('demo', ['cs.utils.cancellable'])
.run(function ($http, csCancellable) {
  var myFunction = csCancellable(
    function (data) {
      console.log(data);
    }
  );

  myFunction.onCancel(function () {
    console.log('onCancel: cancelled');
  });
  myFunction.cancel.promise.then(function () {
    console.log('promise: cancelled');
  });

  var runTests = function () {
    $http.get('https://api.github.com/repos/chunkysamurai/csCancellable', { timeout: myFunction.cancel.promise }).then(myFunction);
    myFunction('test');
    console.log('tests run');
  }

  runTests(); // logs a large JSON object, then "test", then "tests run"
  myFunction.cancel(); // logs "promise: cancelled" and "onCancel: cancelled"
  runTests();  // logs "tests run"

});
```

###Installation

####Requirements

- AngularJS

####Usage

You can get it from [Bower](http://bower.io)

```
# Latest version
bower install https://github.com/ChunkySamurai/csCancellable.git

# A specific version
bower install https://github.com/ChunkySamurai/csCancellable.git#v0.0.1

```

This will copy the csCancellable files into a `bower_components` folder, along with its dependencies. Load the script files in your application:

```html
<script type="text/javascript" src="bower_components/angular/angular.js"></script>
<script type="text/javascript" src="bower_components/csCancellable/csCancellable.js"></script>
```

Add `cs.utils.cancellable` as a module dependency

```javascript
var myAppModule = angular.module('myApp', ['cs.utils.cancellable']);
```
