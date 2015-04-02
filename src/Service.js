/**
 * @class
 * @description
 *
 * The class of service which holds information of about service
 * and allows to customize it whatever you need. Also it is possible
 * to create instance of the service directly from this class.
 *
 * @throws {Error}
 *      Throws error if:<br />
 *      - was missed or specified not valid the service manager instance;<br />
 *      - was missed or specified not valid the name of service;<br />
 *      - was missed or specified not valid the definition of service.
 *
 * @param {Subclass.Service.ServiceManager} serviceManager
 *      The instance of service manager
 *
 * @param {string} serviceName
 *      The name of the creating service
 *
 * @param {Object} serviceDefinition
 *      The definition of the service.<pre>
 *
 * Allowed options:
 * -------------------------------------------------------------------------------------
 *
 * className   {string}    req           The name of service class.
 *
 *                                       It is always required
 *                                       except the case when the service was
 *                                       not marked as abstract.
 *
 *                                       Example:
 *
 *                                       var services = {
 *                                         ...
 *                                         bar: {
 *                                           className: "Name/Of/BarServiceClass",
 *                                         }
 *                                       };
 *
 * abstract    {boolean}   opt   false   If it's true that means you can't create
 *                                       an instance of class. Also it means that
 *                                       all options of this service definition
 *                                       are optional (including the "className"
 *                                       option).
 *
 *                                       it's convenient in use to inherit
 *                                       the definition options from abstract
 *                                       service to others.
 *
 * extends     {string}    opt           Specifies name of service which current one
 *                                       will extends. The lacking options in services
 *                                       that extends another service will be added
 *                                       from the parent services
 *
 *                                       Example:
 *
 *                                       var services = {
 *
 *                                          // Extending from another service
 *
 *                                          error: {
 *                                             className: "Name/Of/BaseErrorClass",
 *                                             arguments: ["%mode%"],
 *                                             tags: ["errorManager"]
 *                                          },
 *                                          invalidArgumentError: {
 *                                              extends: "error"
 *                                          },
 *
 *                                          ...
 *
 *                                          // Extending from abstract service
 *
 *                                          bugAbstract: {
 *                                             abstract: true,
 *                                             arguments: ["%mode%"],
 *                                             tags: ["logger"]
 *                                          },
 *                                          bug1: {
 *                                             extends: "bugAbstract",
 *                                             className: "Name/Of/BugClass1"
 *                                          },
 *                                          bug2: {
 *                                             extends: "bugAbstract",
 *                                             className: "Name/Of/BugClass2"
 *                                          },
 *                                          ...
 *                                       }
 *
 * arguments   {Array}     opt   []      Array of arguments, that will injected
 *                                       into $_constructor function of the class
 *
 *                                       Example:
 *
 *                                       var services = {
 *                                         ...
 *                                         foo: {
 *                                           className: "Name/Of/FooServiceClass",
 *                                           arguments: [arg1, arg2, ...]
 *                                         }
 *                                       };
 *
 *                                       it is possible to specify things different
 *                                       from the literals. You can specify the
 *                                       instance of another service (using syntax
 *                                       "@service_name") or the parameter value
 *                                       (using syntax "%parameter_name").
 *
 *                                       Example:
 *
 *                                       var parameters = {
 *                                          ...
 *                                          mode: "dev",
 *                                          ...
 *                                       };
 *                                       ...
 *
 *                                       var services = {
 *                                         ...
 *                                         bar: {
 *                                           className: "Name/Of/BarServiceClass"
 *                                         },
 *                                         foo: {
 *                                           className: "Name/Of/FooServiceClass",
 *                                           arguments: ["@bar", "%mode%"]
 *                                         }
 *                                       };
 *
 *                                       When trying to create instance of "foo"
 *                                       service to the constructor function
 *                                       will be passed two arguments:
 *                                       the instance of service "bar"
 *                                       and the value of the parameter "mode",
 *                                       i.e. the string "dev".
 *
 *                                       Also it is possible include parameter
 *                                       value to the string literal like:
 *                                       "some string with %param% value"
 *
 * calls       {Object}    opt   {}      List of key/value pairs where key is
 *                                       a method name of the service class and
 *                                       value is an array with arguments for
 *                                       this method.
 *
 *                                       Example:
 *
 *                                       var services = {
 *                                         ...
 *                                         foo: {
 *                                           className: "Name/Of/FooServiceClass",
 *                                           calls: {
 *                                             method1: [arg1, arg2, ...],
 *                                             method2: [arg1, arg2, ...],
 *                                           }
 *                                         },
 *                                         ...
 *                                       };
 *
 *                                       Similarly to the "arguments" option you
 *                                       can specify the instance of another
 *                                       service or the parameter value other
 *                                       than simple literals.
 *
 *                                       It will work in the same way but for the
 *                                       methods specified in "calls" service
 *                                       option instead.
 *
 * singleton   {boolean}   opt   true    Tells whether current service will returns
 *                                       new instance every time you trying to get
 *                                       it using serviceManager.getService()
 *                                       method call.
 *
 * tags        {Array}     opt   []      An array of the service names. Uses in cases
 *                                       when you want to mark belonging of the one
 *                                       service to another.
 *
 *                                       The service which name uses in "tags" option
 *                                       will receive the services marked by tag with
 *                                       its name when you try to create instance
 *                                       of this service.
 *
 *                                       The such service should implement the
 *                                       "Subclass/Service/TaggableInterface"
 *                                       interface.
 *
 * </pre>
 */
Subclass.Service.Service = (function()
{
    /**
     * @alias Subclass.Service.Service
     */
    function Service(serviceManager, serviceName, serviceDefinition)
    {
        if (!serviceManager || !(serviceManager instanceof Subclass.Service.ServiceManager)) {
            Subclass.Error.create('InvalidArgument')
                .argument('the service manager', false)
                .received(serviceManager)
                .expected('instance of "Subclass.Service.ServiceManager" class')
                .apply()
            ;
        }
        if (!serviceName || typeof serviceName != 'string' || !serviceName.match(/^[0-9_a-z]+$/i)) {
            Subclass.Error.create('InvalidArgument')
                .argument('the name of service', false)
                .received(serviceName)
                .expected('a string')
                .apply()
            ;
        }

        /**
         * Service manager instance
         *
         * @type {Subclass.Service.ServiceManager}
         * @private
         */
        this._serviceManager = serviceManager;

        /**
         * Name of the service
         *
         * @type {string}
         * @private
         */
        this._name = serviceName;

        /**
         * Definition of the service
         *
         * @type {Object}
         * @private
         */
        this._definition = this.setDefinition(serviceDefinition);

        /**
         * Instance of service class
         *
         * @type {Object}
         * @private
         */
        this._instance = null;

        /**
         * Indicates whether current service is initialized
         *
         * @type {boolean}
         * @private
         */
        this._initialized = false;
    }

    /**
     * Returns the instance of service manager
     *
     * @method getServiceManager
     * @memberOf Subclass.Service.Service.prototype
     *
     * @returns {Subclass.Service.ServiceManager}
     */
    Service.prototype.getServiceManager = function()
    {
        return this._serviceManager;
    };

    /**
     * Returns the name of the service
     *
     * @method getName
     * @memberOf Subclass.Service.Service.prototype
     *
     * @returns {string}
     */
    Service.prototype.getName = function()
    {
        return this._name;
    };

    /**
     * Sets service definition
     *
     * @method setDefinition
     * @memberOf Subclass.Service.Service.prototype
     *
     * @throws {Error}
     *      Throws error specified not valid definition
     *
     * @param {Object} definition
     *      The definition of the service
     *
     * @returns {Object}
     */
    Service.prototype.setDefinition = function(definition)
    {
        if (!definition || !Subclass.Tools.isPlainObject(definition)) {
            Subclass.Error.create('InvalidArgument')
                .argument('the definition of service', false)
                .received(definition)
                .expected('a plain object')
                .apply()
            ;
        }
        this._definition = definition;

        return definition;
    };

    /**
     * Returns the service definition
     *
     * @method getDefinition
     * @memberOf Subclass.Service.Service.prototype
     *
     * @returns {Object}
     */
    Service.prototype.getDefinition = function()
    {
        return this._definition;
    };

    /**
     * Initializes service.<br /><br />
     * In this stage the service configuration will be validated and performed.<br />
     * It method should be invoked once before the service instance will be created.
     *
     * @method initialize
     * @memberOf Subclass.Service.Service.prototype
     */
    Service.prototype.initialize = function()
    {
        this.validateDefinition();
        this.processDefinition();
    };

    /**
     * Checks whether current service was initialized
     *
     * @method isInitialized
     * @memberOf Subclass.Service.Service.prototype
     *
     * @returns {boolean}
     */
    Service.prototype.isInitialized = function()
    {
        return this._initialized;
    };

    /**
     * Creates and returns instance of service class.<br />
     * The alias of method {@link Subclass.Service.ServiceManager#getService}
     *
     * @method createInstance
     * @memberOf Subclass.Service.Service.prototype
     *
     * @returns {Object}
     */
    Service.prototype.createInstance = function()
    {
        return this.getServiceManager()
            .getServiceFactory()
            .getService(this)
        ;
    };

    /**
     * Sets service class instance after it was created.<br /><br />
     *
     * If the service was configured as singleton then this set instance
     * will be returned every time when the instance of service will be requested..
     *
     * @method setInstance
     * @memberOf Subclass.Service.Service.prototype
     *
     * @throws {Error}
     *      Throws error if was attempt to create an instance of abstract service
     *
     * @param {Object} instance
     *      The instance of the service class
     */
    Service.prototype.setInstance = function(instance)
    {
        if (this.getAbstract()) {
            Subclass.Error.create('AbstractService')
                .service(this.getName())
                .apply()
            ;
        }
        this._instance = instance;
    };

    /**
     * Returns the service class instance that was created earlier
     *
     * @method getInstance
     * @memberOf Subclass.Service.Service.prototype
     *
     * @throws {Error}
     *      Throws error if trying to get instance of abstract service class
     *
     * @returns {Object}
     */
    Service.prototype.getInstance = function()
    {
        if (this.getAbstract()) {
            Subclass.Error.create('AbstractService')
                .service(this.getName())
                .apply()
            ;
        }
        return this._instance;
    };

    /**
     * Validates "abstract" option value
     *
     * @method validateAbstract
     * @memberOf Subclass.Service.Service.prototype
     *
     * @throws {Error}
     *      Throws error when specified not valid "abstract" option value
     *
     * @param {*} isAbstract
     *      The "abstract" option value
     *
     * @returns {boolean}
     */
    Service.prototype.validateAbstract = function(isAbstract)
    {
        if (typeof isAbstract != 'boolean') {
            Subclass.Error.create('InvalidServiceOption')
                .option('abstract')
                .service(this.getName())
                .received(isAbstract)
                .expected('a boolean')
                .apply()
            ;
        }
        return true;
    };

    /**
     * Validates and then sets the "abstract" option value
     *
     * @method setAbstract
     * @memberOf Subclass.Service.Service.prototype
     *
     * @throws {Error}
     *      Throws error if trying to change "abstract" option after the service was initialized.
     *
     * @param {boolean} isAbstract
     *      The "abstract" option value
     */
    Service.prototype.setAbstract = function(isAbstract)
    {
        if (this.isInitialized()) {
            Subclass.Error.create('ServiceInitialized')
                .service(this.getName())
                .apply()
            ;
        }
        this.validateAbstract(isAbstract);
        this.getDefinition().abstract = isAbstract;
    };

    /**
     * Returns the "abstract" option value
     *
     * @method getAbstract
     * @memberOf Subclass.Service.Service.prototype
     *
     * @returns {string}
     */
    Service.prototype.getAbstract = function()
    {
        return this.getDefinition().abstract;
    };

    /**
     * Validates the "extends" option value
     *
     * @method validateExtends
     * @memberOf Subclass.Service.Service.prototype
     *
     * @throws {Error}
     *      Throws error if was specified not valid value for the "extends" option
     *
     * @param {*} parentServiceName
     *      The name of the parent service which the current one will extend
     *
     * @returns {boolean}
     */
    Service.prototype.validateExtends = function(parentServiceName)
    {
        if (typeof parentServiceName != 'string') {
            Subclass.Error.create('InvalidServiceOption')
                .option('extends')
                .service(this.getName())
                .received(parentServiceName)
                .expected('a string')
                .apply()
            ;
        }
        return true;
    };

    /**
     * Validates and then sets the "extends" option value
     *
     * @method setExtends
     * @memberOf Subclass.Service.Service.prototype
     *
     * @throws {Error}
     *      Throws error if trying to change "extends" option after the service was initialized.
     *
     * @param {string} parentServiceName
     *      The name of the parent service which the current one will extend
     */
    Service.prototype.setExtends = function(parentServiceName)
    {
        if (this.isInitialized()) {
            Subclass.Error.create('ServiceInitialized')
                .service(this.getName())
                .apply()
            ;
        }
        this.validateExtends(parentServiceName);
        this.getDefinition().extends = parentServiceName;
    };

    /**
     * Returns the "extends" option value
     *
     * @method getExtends
     * @memberOf Subclass.Service.Service.prototype
     *
     * @returns {string}
     */
    Service.prototype.getExtends = function()
    {
        return this.getDefinition().extends;
    };

    /**
     * Validates the "className" option value
     *
     * @method validateClassName
     * @memberOf Subclass.Service.Service.prototype
     *
     * @throws {Error}
     *      Throws error if specified not valid value name of service class
     *
     * @param {*} className
     *      The name of service class
     *
     * @returns {boolean}
     */
    Service.prototype.validateClassName = function(className)
    {
        if (typeof className != 'string') {
            Subclass.Error.create('InvalidServiceOption')
                .option('className')
                .service(this.getName())
                .received(className)
                .expected('a string')
                .apply()
            ;
        }
        return true;
    };

    /**
     * Validates and then sets the "className" option value
     *
     * @method setClassName
     * @memberOf Subclass.Service.Service.prototype
     *
     * @throws {Error}
     *      Throws error if trying to change "className" option after the service was initialized.
     *
     * @param {string} className
     *      The name of service class
     */
    Service.prototype.setClassName = function(className)
    {
        if (this.isInitialized()) {
            Subclass.Error.create('ServiceInitialized')
                .service(this.getName())
                .apply()
            ;
        }
        this.validateClassName(className);
        this.getDefinition().className = className;
    };

    /**
     * Returns the "className" option value
     *
     * @method getClassName
     * @memberOf Subclass.Service.Service.prototype
     *
     * @returns {string}
     */
    Service.prototype.getClassName = function()
    {
        return this.getDefinition().className;
    };

    /**
     * Validates the "arguments" option value
     *
     * @method validateArguments
     * @memberOf Subclass.Service.Service.prototype
     *
     * @throws {Error}
     *      Throws error if specified not valid "arguments" option value
     *
     * @param {*} args
     *      The array each element of which will be passed
     *      to the service class constructor as an argument.
     *
     * @returns {boolean}
     */
    Service.prototype.validateArguments = function(args)
    {
        if (args !== null && !Array.isArray(args)) {
            Subclass.Error.create('InvalidServiceOption')
                .option('arguments')
                .service(this.getName())
                .received(args)
                .expected('an array')
                .apply()
            ;
        }
        return true;
    };

    /**
     * Validates and then sets the "arguments" option value
     *
     * @method setArguments
     * @memberOf Subclass.Service.Service.prototype
     *
     * @throws {Error}
     *      Throws error if trying to change "arguments"
     *      option after the service was initialized.
     *
     * @param {Array} args
     *      The array each element of which will be passed
     *      to the service class constructor as an argument.
     */
    Service.prototype.setArguments = function(args)
    {
        if (this.isInitialized()) {
            Subclass.Error.create('ServiceInitialized')
                .service(this.getName())
                .apply()
            ;
        }
        this.validateArguments(args);
        this.getDefinition().arguments = args;
    };

    /**
     * Normalizes the arguments array.<br /><br />
     *
     * Defining the service it is possible to specify in arguments for class constructor
     * or for methods the things different from literals.<br /><br />
     *
     * For example, you can specify the service instance (using syntax "@service_name")
     * or parameter value (using syntax "%parameter_name%").
     *
     * @method normalizeArguments
     * @memberOf Subclass.Service.Service.prototype
     *
     * @param args
     *      An array of arguments for the service class constructor
     *      or its methods
     */
    Service.prototype.normalizeArguments = function(args)
    {
        var serviceManager = this.getServiceManager();
        var parameterManager = serviceManager.getModule().getParameterManager();

        if (!args) {
            return [];
        }

        args = Subclass.Tools.extend([], args);

        for (var i = 0; i < args.length; i++) {
            var value = args[i];

            if (typeof value == 'string' && value.match(/^@[a-z_0-9]+$/i)) {
                var serviceName = value.substr(1);
                args[i] = serviceManager.getService(serviceName);

            } else if (typeof value == 'string' && value.match(/%.+%/i)) {
                var regex = /%([^%]+)%/i;

                while (regex.test(value)) {
                    var parameterName = value.match(regex)[1];
                    var parameterValue = parameterManager.getParameter(parameterName);

                    value = value.replace(regex, parameterValue);
                }
                args[i] = value;
            }
        }
        return args;
    };

    /**
     * Returns "arguments" option value
     *
     * @method getArguments
     * @memberOf Subclass.Service.Service.prototype
     *
     * @returns {Array}
     */
    Service.prototype.getArguments = function()
    {
        return this.getDefinition().arguments || [];
    };

    /**
     * Validates "calls" option value
     *
     * @method validateCalls
     * @memberOf Subclass.Service.Service.prototype
     *
     * @throws {Error}
     *      Throws error if was specified invalid value of the "calls" service option
     *
     * @param {*} calls
     *      The object which keys are the method names and values are its arguments.
     *      The rules of specifying the arguments is the same as for the "arguments" option.
     *
     * @returns {boolean}
     */
    Service.prototype.validateCalls = function(calls)
    {
        try {
            if ((!calls && calls !== null) || (calls && typeof calls != 'object')) {
                throw 'error'
            }
            if (calls) {
                for (var methodName in calls) {
                    if (!calls.hasOwnProperty(methodName)) {
                        continue;
                    }
                    if (!Array.isArray(calls[methodName])) {
                        throw 'error';
                    }
                }
            }
        } catch (e) {
            if (e == 'error') {
                Subclass.Error.create('InvalidServiceOption')
                    .option('calls')
                    .service(this.getName())
                    .received(calls)
                    .expected('a plain object with array properties')
                    .apply()
                ;
            } else {
                throw e;
            }
        }
        return true;
    };

    /**
     * Validates and then sets "calls" option value
     *
     * @method setCalls
     * @memberOf Subclass.Service.Service.prototype
     *
     * @throws {Error}
     *      Throws error if trying to change "calls" option after the service was initialized.
     *
     * @param {Object.<Array>} calls
     *      The object which keys are the class method name and its values are the arrays of arguments.
     *      To see more details look at the "calls" option description in {@link Subclass.Service.Service}
     */
    Service.prototype.setCalls = function(calls)
    {
        if (this.isInitialized()) {
            Subclass.Error.create('ServiceInitialized')
                .service(this.getName())
                .apply()
            ;
        }
        this.validateCalls(calls);
        this.getDefinition().calls = calls;
    };

    /**
     * Normalizes arguments of methods specified in the "calls" option.<br /><br />
     *
     * It performs arguments array from each specified method in the same way as
     * the method {@link Subclass.Service.Service#normalizeArguments}
     *
     * @method normalizeCalls
     * @memberOf Subclass.Service.Service.prototype
     *
     * @param {Object.<Array>} calls
     *      The object with method names and its arguments
     *
     * @returns {Object.<Array>}
     */
    Service.prototype.normalizeCalls = function(calls)
    {
        if (!calls) {
            return {};
        }

        calls = Subclass.Tools.extend({}, calls);

        if (calls) {
            for (var methodName in calls) {
                if (!calls.hasOwnProperty(methodName)) {
                    continue;
                }
                calls[methodName] = this.normalizeArguments(calls[methodName]);
            }
        }
        return calls;
    };

    /**
     * Returns the "calls" option value
     *
     * @method getCalls
     * @memberOf Subclass.Service.Service.prototype
     *
     * @returns {Array}
     */
    Service.prototype.getCalls = function()
    {
        return this.getDefinition().calls || {};
    };

    /**
     * Validates the "singleton" option value
     *
     * @method validateSingleton
     * @memberOf Subclass.Service.Service.prototype
     *
     * @throws {Error}
     *      Throws error if specified invalid not a boolean value
     *
     * @param {*} singleton
     *      The value of "singleton" option
     *
     * @returns {boolean}
     */
    Service.prototype.validateSingleton = function(singleton)
    {
        if (singleton !== null && typeof singleton != 'boolean') {
            Subclass.Error.create('InvalidServiceOption')
                .option('singleton')
                .service(this.getName())
                .received(singleton)
                .expected('a boolean')
                .apply()
            ;
        }
        return true;
    };

    /**
     * Validates and sets "singleton" option value
     *
     * @method setSingleton
     * @memberOf Subclass.Service.Service.prototype
     *
     * @throws {Error}
     *      Throws error if trying to change "singleton" option after the service was initialized.
     *
     * @param {string} singleton
     *      The flag whether this service is singleton, i.e. always returns the same instance
     *      once it was created (if it's true) or should return the new instance every time
     *      when you want to receive this service.
     */
    Service.prototype.setSingleton = function(singleton)
    {
        if (this.isInitialized()) {
            Subclass.Error.create('ServiceInitialized')
                .service(this.getName())
                .apply()
            ;
        }
        this.validateSingleton(singleton);
        this.getDefinition().singleton = singleton;
    };

    /**
     * Returns the "singleton" option value
     *
     * @method getSingleton
     * @memberOf Subclass.Service.Service.prototype
     *
     * @returns {boolean}
     */
    Service.prototype.getSingleton = Service.prototype.isSingleton = function()
    {
        return this.getDefinition().singleton;
    };

    /**
     * Validates the "tags" option value
     *
     * @method validateTags
     * @memberOf Subclass.Service.Service.prototype
     *
     * @throws {Error}
     *      Throws error if specified not array of strings
     *
     * @param {*} tags
     *      The array with names of services for which current one belongs to
     *
     * @returns {boolean}
     */
    Service.prototype.validateTags = function(tags)
    {
        if (tags !== null && !Array.isArray(tags)) {
            Subclass.Error.create('InvalidServiceOption')
                .option('tags')
                .service(this.getName())
                .received(tags)
                .expected('an array of strings')
                .apply()
            ;
        }
        return true;
    };

    /**
     * Validates and then sets "tags" option value
     *
     * @method setTags
     * @memberOf Subclass.Service.Service.prototype
     *
     * @throws {Error}
     *      Throws error if trying to change "singleton" option after the service was initialized.
     *
     * @param {Array} tags
     *      The array with names of services for which current one belongs to
     */
    Service.prototype.setTags = function(tags)
    {
        if (this.isInitialized()) {
            Subclass.Error.create('ServiceInitialized')
                .service(this.getName())
                .apply()
            ;
        }
        this.validateTags(tags);
        this.getDefinition().tags = tags;
    };

    /**
     * Returns the "tags" option value
     *
     * @method getTags
     * @memberOf Subclass.Service.Service.prototype
     *
     * @returns {string[]}
     */
    Service.prototype.getTags = function()
    {
        return this.getDefinition().tags || [];
    };

    /**
     * Returns the base service definition with options with its default values.
     *
     * @method getBaseDefinition
     * @memberOf Subclass.Service.Service.prototype
     *
     * @returns {Object}
     */
    Service.prototype.getBaseDefinition = function()
    {
        return {

            /**
             * The abstract service marker
             *
             * @type {boolean}
             * @ignore
             */
            abstract: false,

            /**
             * The name of parent service
             *
             * @type {string}
             * @ignore
             */
            extends: null,

            /**
             * The name of service class
             *
             * @type {string}
             * @ignore
             */
            className: null,

            /**
             * The array of service class constructor arguments
             *
             * @type {Array}
             * @ignore
             */
            arguments: [],

            /**
             * List with method names and its arguments which will be called
             * immediately after service class instance creation
             *
             * @type {Object}
             * @ignore
             */
            calls: {},

            /**
             * The singleton marker
             *
             * @type {boolean}
             * @ignore
             */
            singleton: true,

            /**
             * The list of tags
             *
             * @type {string[]}
             * @ignore
             */
            tags: []
        }
    };

    /**
     * Validates the definition of service
     *
     * @method validateDefinition
     * @memberOf Subclass.Service.Service.prototype
     *
     * @throws {Error}
     *      Throws error if definition of service is not valid
     */
    Service.prototype.validateDefinition = function()
    {
        var serviceManager = this.getServiceManager();
        var tags = this.getTags();
        var args = this.getArguments();
        var calls = this.getCalls();
        var chain = [this.getName()];
        var $this = this;

        if (arguments[0] && Array.isArray(chain)) {
            chain = arguments[0];
        }

        function validateArguments(arg)
        {
            if (typeof arg == 'string' && arg.match(/^@[a-z_0-9]+$/i)) {
                var serviceName = arg.substr(1);

                if (tags.indexOf(serviceName) >= 0 || serviceName == chain[0]) {
                    Subclass.Error.create(
                        'Can\'t create instance of service "' + $this.getName() + '". ' +
                        'Circular dependency injection was found.'
                    );
                }
                if (chain.indexOf(serviceName) > 0) {
                    return;
                }
                var service = serviceManager.getServiceDefinition(serviceName);
                    chain.concat(service.validateDefinition(chain));
            }
        }

        // Validating arguments

        for (var i = 0; i < args.length; i++) {
            validateArguments(args[i]);
        }

        // Validating calls

        for (var methodName in calls) {
            if (calls.hasOwnProperty(methodName)) {
                for (i = 0; i < calls[methodName].length; i++) {
                    validateArguments(calls[methodName][i]);
                }
            }
        }

        return chain;
    };

    /**
     * Processing and initializing of service definition.
     *
     * @method processDefinition
     * @memberOf Subclass.Service.Service.prototype
     */
    Service.prototype.processDefinition = function()
    {
        var definition = this.getDefinition();
        this._definition = this.getBaseDefinition();

        for (var attrName in definition) {
            if (!definition.hasOwnProperty(attrName)) {
                continue;
            }
            var setterMethod = "set" + attrName[0].toUpperCase() + attrName.substr(1);

            if (this[setterMethod]) {
                this[setterMethod](definition[attrName]);
            }
        }

        // Tells that service was initialized

        this._initialized = true;
    };

    return Service;

})();