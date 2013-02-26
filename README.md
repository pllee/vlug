vlug
====

Performance and other utilities that can help with JavaScript development.

Vlug.Interceptor
===
Intercepts methods on objects to add time info or console logs or functions that will get called before and after the intercepted method is called.  Info on functions can be obtained without putting log statements in your source code or libraries.  Time logs keep track of how many times a function has been called and how long it has run for.  When put on the prototype of a class this can be useful information to have without having to dig through and have the overhead of a profiler.  Functions can be used to add a quick breakpoint on a child class instead of doing a conditional breakpoint of:

```js
this instanceof Child
```

Sample usage:

```js
   var interceptor = new Vlug.Interceptor({
        logs: {
            obj: Vlug.Runner.prototype,
            fnName: 'run',
            before: 'running ...',
            after: function(f) {
                return 'first call arg ' + f;
            }
        },
        times: [{
            obj: Vlug.Runner.prototype,
            fnName: 'run'
        }],
        functions: {
            obj: Vlug.Runner.prototype,
            fnName: 'run',
            before: function() {
                window.alert('running ....')
            }
        }
    }),
    v = new Vlug.Runner({
        log: false,
        // .....
    });
```

v.run('a') would output something like

```js
running ...
first call arg a 
//This is from the times
run: 14.539ms 
```

interceptor.getReport() would output something like:

```js
{ run:
    {"iterationsRun":1,"totalTime":14.53899999614805,"average":14.53899999614805}
}
```
Check out the [docs](http://pllee.github.com/vlug/docs/#!/api/Vlug.Interceptor) for full documentation.

Vlug.Runner
===

Runs a set of functions for n number of iterations and keeps time info on the set of functions.  This can be used for getting time comparisons. 

Sample usage:

```js
var arr = [1,2 3],
runner = new Vlug.Runner({
    //defaults to true
    log: true,
    iterations: 10000,
    functions: [{
        fn: function() {
            var a;
            arr.forEach(function(value, index) {
                a = value + index;
            });
        },
        name: 'nativeForEach'
    }, {
        fn: function() {
            var a;
            Vlug.utils.Array.forEach(arr, function(value, index) {
                a = value + index;
            });
        },
        name: 'VlugForEach'
    }, {
        fn: function() {
            var a, i = 0,
                len = arr.length
            for(; i < len; ++i) {
                a = arr[i] + i;
            }
        },
        name: 'forLoop'
    }]
});

runner.run();
```
would show console.time outputs to the console like:

```js
nativeForEach: 7.304ms 
VlugForEach: 8.032ms 
forLoop: 0.796ms
```

after calling run 2 more times runner.getReport() would return something like:

```js
{
    "nativeForEach": {
        "iterationsRun": 30000,
        "totalTime": 13.921000011090655,
        "average": 0.0008307000003696885
    },
    "VlugForEach": {
        "iterationsRun": 30000,
        "totalTime": 14.927000003808644,
        "average": 0.0004975666667936215
    },
    "forLoop": {
        "iterationsRun": 30000,
        "totalTime": 1.0809999948833138,
        "average": 0.00003603333316277712
    }
}
```

Check out the [docs](http://pllee.github.com/vlug/docs/#!/api/Vlug.Runner) for full documentation.
