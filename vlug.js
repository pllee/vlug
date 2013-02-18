/*
 * Vlug
 * Version 0.1.
 */
(function() {

    var context = this,
    oldVlug = context.Vlug;

    Vlug = {};

    Vlug.noConflict = function() {
        context.Vlug = oldVlug;
    }

    Vlug.initialContext = context;

    (function() {
        var apply = function(t, f) {
                var to = t || {},
                    from = f || {},
                    prop;

                for(prop in from) {
                    if(from.hasOwnProperty(prop)) {
                        to[prop] = from[prop];
                    }
                }

                return to;
            };

        var mix = function(t, f) {
                var to = t,
                    from = f,
                    prop;

                for(prop in from) {
                    if(from.hasOwnProperty(prop) && typeof to[prop] === 'undefined') {
                        to[prop] = from[prop];
                    }
                }

                return to;
            };

        var forEach = (function() {
            var nativeForEach = Array.prototype.forEach;
            if(nativeForEach) {
                return function(arr, fn, context) {
                    nativeForEach.call(arr, fn, context);
                };
            }

            return function(arr, fn, context) {
                var i, len = arr.length;

                for(i = 0; i < len; ++i) {
                    fn.call(context || this, arr[i], i, arr);
                }

                return arr;
            };
        })();

        var isArray = (function() {
            var nativeIsArray = Array.isArray;
            if(nativeIsArray) {
                return nativeIsArray;
            }

            return function(arr) {
                return toString.call(arr) === '[object Array]';
            };
        })();

        var arrayFrom = function(arrOrItem) {
                if(Vlug.utils.Array.isArray(arrOrItem)) {
                    return arrOrItem;
                }
                return(typeof arrOrItem === 'undefined') ? [] : [arrOrItem];
            }

        var each = function(arrOrItem, fn, context) {
                return forEach(arrayFrom(arrOrItem), fn, context);
            }

        var con = (function() {
            var time = console.time,
                timeEnd = console.timeEnd,
                timeIds;

            if(!time) {
                timeIds = {};
                time = function(id) {
                    timeIds[id] = new Date();
                };
                timeEnd = function(id) {
                    var millis = new Date().getTime() - timeIds[id].getTime();
                    delete timeIds.id;
                    console.log('%s : %ims', id, millis);
                };
            } else {
                time = function(id) {
                    console.time.call(console, id);
                };
                timeEnd = function(id) {
                    console.timeEnd.call(console, id);
                };
            }

            return {
                time: time,
                timeEnd: timeEnd
            }
        })();

        var timeStamp = (function() {
            if(typeof performance !== 'undefined' && performance.now) {
                return function() {
                    return performance.now();
                };
            }
            return function() {
                return new Date().getTime();
            };

        })();

        apply(Vlug, {
            utils: {
                apply: apply,
                mix: mix,
                Array: {
                    forEach: forEach,
                    each: each,
                    isArray: isArray,
                    from: arrayFrom
                },
                console: con,
                timeStamp: timeStamp
            },
            mixins: {},
            abstractFn: function() {
                throw new Error('abstractFn must be implemented')
            },
            emptyFn: function() {}
        });

    })();

    Vlug.mixins.TimeTracker = {
        stampStart: function(id) {
            this._initTimes();
            if(this.log) {
                Vlug.utils.console.time(id);
            }
            this._timeStamps[id] = Vlug.utils.timeStamp();
        },

        _initTimes: function() {
            if(!this._timeStamps) {

                this._timeStamps = {};

                this._totalTimes = {};
            }
        },
        stampEnd: function(id) {
            var start = this._timeStamps[id],
                currentRunTime = Vlug.utils.timeStamp() - start;
            this._trackTime(id, currentRunTime);
            if(this.log) {
                Vlug.utils.console.timeEnd(id);
            }
        },

        _trackTime: function(id, runtime) {
            if(!this._totalTimes[id]) {
                this._totalTimes[id] = {
                    iterationsRun: 0,
                    totalTime: 0
                };
            }
            this._totalTimes[id].iterationsRun += this._getIterationsToAdd(id);
            this._totalTimes[id].totalTime += runtime;
        },

        _getIterationsToAdd: Vlug.abstractFn,

        getReport: function() {
            return this._buildReportObject();
        },

        _buildReportObject: function() {
            var prop, report = {};

            for(prop in this._totalTimes) {
                if(this._totalTimes.hasOwnProperty(prop)) {
                    report[prop] = Vlug.utils.apply({}, this._totalTimes[prop]);
                    report[prop].average = report[prop].totalTime / report[prop].iterationsRun;
                }
            }

            return report;
        }
    };
    /**
     * @class Vlug.Runner
     * Runs a set of functions for n number of iterations
     * and keeps time info on the set of functions.
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
        * would show console.time outputs to the console like: 
        nativeForEach: 7.304ms 
        VlugForEach: 8.032ms 
        forLoop: 0.796ms
        *after calling run 2 more times runner.getReport() would return something like:
        {
            "nativeForEach": {
                "iterationsRun": 30000,
                "totalTime": 24.921000011090655,
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
     */
    Vlug.Runner = function(config) {
        this.init(config);
    };

    Vlug.Runner.prototype = {
        /**
         * @cfg {Number} iterations
         * The number of iterations for the function(s) to run.
         */
        iterations: 10,

        /**
         * @cfg {Function|Function[]|{}|{}[]} functions
         functions can either be Functions or objects in the form of :
         *@cfg functions.name {String} the identifier name for the function
         *@cfg functions.fn {Function} (required) the function to call 
         functions: {
                fn: function() {
                    var a, 
                        arr = [1,2,3];

                    arr.forEach(function(value, index) {
                        a = value + index;
                    });
                },
                name: 'forEach'
            }
        *this is also a valid config: 
         functions: [function(){return 1;}, function(){return 2;}]
         */
        /**
         * @cfg {Boolean} log
         * true to output console.time info
         */
        log: true,

        init: function(config) {
            Vlug.utils.apply(this, config);
        },

        /**
        * @method run
        * Runs the configured functions for the configured amount 
        * of iterations.  If log is true it will output console.time info
        */
        run: function() {
            Vlug.utils.Array.forEach(this.functions, function(functionOrObj, index) {
                var name = functionOrObj.name,
                fn;

                if (name) {
                    fn = functionOrObj.fn || functionOrObj;
                } else {
                    name = 'index:' + index;
                    fn = functionOrObj;
                }

                this._runFunction(fn, name);

            }, this);
        },

        _runFunction: function(fn, name) {
            this.stampStart(name);
            this._runFunctionForIterations(fn);
            this.stampEnd(name);
        },

        _runFunctionForIterations: function(fn) {
            var iterations = this.iterations,
                i = 0;
            for(; i < iterations; ++i) {
                fn();
            }
        },

        /**
         * Set the amount of iterations to run.
         * @param {Number} iterations
         */
        setIterations: function(iterations) {
            this.iterations = iterations;
        },

        /**
         * Set log to true to show console log outputs.
         * @param {Boolean} log
         */
        setLog: function(log) {
            this.log = log;
        },

        //@implement
        _getIterationsToAdd: function() {
            return this.iterations;
        }

        /**
         * @method getReport
         * Returns the time info for functions the 
         * run, they are keyed off by function name.  The time
         * info will may vary slightly from the console.time output.
         * @return {Object}
         */
    };

    Vlug.utils.mix(Vlug.Runner.prototype, Vlug.mixins.TimeTracker);
    /**
     * @class Vlug.Interceptor
     * Intercepts methods on objects to add time info and or console logs.
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
            }]
        }),
        v = new Vlug.Runner({
            log: false,
            // .....
        });

        *v.run('a') would output something like
        running ...
        first call arg a 
        //This is from the times
        run: 14.539ms 
        
        *interceptor.getReport() would output something like:
        { run:
            {"iterationsRun":1,"totalTime":14.53899999614805,"average":14.53899999614805}
        }
        *after calling interceptor.restore() 
        * the methods will be restored back to their original states.
     */
    Vlug.Interceptor = function(config) {
        this.init(config);
    };

    Vlug.Interceptor.prototype = {
        /**
         * @cfg {{}| {}[]} logs
         * An object or Array of objects in with the following properties
         * @cfg logs.obj {Object} (required) the object that has the function to show logs.
         * @cfg logs.fnName {String} (required) the name of the function to show logs.
         * @cfg logs.before {String|Function} the console output to log before the function is called.
         * @cfg logs.after {String|Function} the console output to log after the function is called.
         * @cfg logs.logResult {Boolean} true to log the return value of the function.
         * 
         *For example this would log <br>
         *"running .." before run is called <br>
         * and <br>
         *"first call arg : undefined" <br>
         *after run is called
         @example
         logs : {
            fnName: 'run',
            obj: Vlug.Runner.prototype,
            before: 'running ...',
            after: function() {
                return 'first call arg' + arguments[0];
            }
         }

         */
        
        /**
         * @cfg {{}| {}[]} times
         * An object or Array of objects in with the following properties
         * @cfg times.obj {Object} (required) the object that has the function to track time.
         * @cfg times.fnName {String} (required) the name of the function to track time.
         * @cfg times.logResult {Boolean} true to log the return value of the function.
         */

        init:function(config) {
            Vlug.utils.apply(this, Vlug.utils.apply(config, {log: true}));
            this._restoreFns = [];
            this._initLogs();
            this._initTimeLogs();
        },

        _initLogs: function() {
            Vlug.utils.Array.each(this.logs, function(interceptConfig){
                this._intercept(this._createLogInterceptConfig(interceptConfig));
            }, this);
        },

        _createLogInterceptConfig: function(c) {
            var config = Vlug.utils.apply({}, c);
            config.before = this._logToFn(config.before);
            config.after = this._logToFn(config.after);

            return config;
        },

        _logToFn: function(stringOrFn) {
            if(typeof stringOrFn === 'function') {
                return function() {
                    console.log(stringOrFn.apply(this, arguments));
                };
            } else if(typeof stringOrFn !== 'undefined') {
                return function() {
                    console.log(stringOrFn);
                };
            }

            return Vlug.emptyFn;
        },

        _initTimeLogs: function() {
            Vlug.utils.Array.each(this.times, function(config, index, arr) {
                var timeConfig = this._createTimeConfig(config, this._hasDuplicateName(config)
                    ? config.fnName + index : config.fnName);
                
                this._intercept(timeConfig);
            }, this);
        },

        _hasDuplicateName: function(cfg){
            var i = 0,
                arr = this.times,
                len = arr.length,
                name = cfg.fnName,
                c;

            for(; i < len; ++i) {
                c = arr[i];
                if(c !== cfg && c.fnName === name) {
                    return true;
                }
            }
        },

        _createTimeConfig: function(cfg, id) {
            var me = this;
            return Vlug.utils.apply(cfg, {
                before: function(){
                    me.stampStart(id);
                },
                after: function(){
                    me.stampEnd(id);
                }
            })
        },

        _intercept: function(interceptConfig) {
            var object = interceptConfig.obj,
                fnName = interceptConfig.fnName,
                oldFn = object[fnName],
                before = interceptConfig.before,
                after = interceptConfig.after,
                logResult = interceptConfig.logResult;
                

            object[fnName] = function() {
                var result;

                before.apply(this, arguments);
                
                result = oldFn.apply(this, arguments);
                
                if(logResult) {
                    console.log(result);
                }

                after.apply(this, arguments);

                return result;
            };

            this._restoreFns.push(function() {
                object[fnName] = oldFn;
            });
        },
        /**
         * @method
         * Restore the intercepted functions back to their original
         * states.
         */
        restore: function() {
            Vlug.utils.Array.forEach(this._restoreFns.reverse(), function(fn){
                fn();
            }, this);
        },

        //@implement
        _getIterationsToAdd: function(id) {
            return 1;
        }

        /**
         * @method getReport
         * Returns the time info for functions the 
         * run, they are keyed off by function name.  The time
         * info will may vary slightly from the console.time output.
         * This will only show info if {@link Vlug.Interceptor#times times } are defined.
         * @return {Object}
         */
    };

    Vlug.utils.mix(Vlug.Interceptor.prototype, Vlug.mixins.TimeTracker);

    if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = Vlug;
    }

})();