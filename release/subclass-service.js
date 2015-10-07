/**
 * SubclassService - v0.1.0 - 2015-10-07
 * https://github.com/msdoom2011/subclass-service
 *
 * Copyright (c) 2015 Dmitry Osipishin | msdoom2011@gmail.com
 */
(function() {
"use strict";

/**
 * @namespace
 */
Subclass.Service = {};

/**
 * @namespace
 */
Subclass.Service.Error = {};

/**
 * @namespace
 */
Subclass.Service.Extension = {};

/**
 * @class
 * @constructor
 * @description
 *
 * The class instance of which used to manipulate of services.<br />
 * It allows to register new service, create and get service instances, get its definitions.
 *
 * @throws {Error}
 *      Throws error if specified module is not instance of Subclass.Module class
 *
 * @param {Subclass.Module} module
 *      The module instance
 */
Subclass.Service.ServiceManager = function()
{
    /**
     * @alias Subclass.Service.ServiceManager
     */
    function ServiceManager(module)
    {
        if (!module || !(module instanceof Subclass.Module)) {
            Subclass.Error.create('InvalidArgument')
                .argument("the instance of module", false)
                .received(module)
                .expected("an instance of Subclass.Module")
                .apply()
            ;
        }

        /**
         * Instance of module
         *
         * @type {Subclass.Module}
         * @private
         */
        this._module = module;

        /**
         * List of properties
         *
         * @type {Object}
         * @private
         */
        this._parameters = {};

        /**
         * List of services
         *
         * @type {Object.<Subclass.Service.Service>}
         * @private
         */
        this._services = {};
    }

    /**
     * Initializing service manager
     *
     * @method initialize
     * @memberOf Subclass.Service.ServiceManager.prototype
     */
    ServiceManager.prototype.initialize = function()
    {
        var eventManager = this.getModule().getEventManager();
        var $this = this;

        eventManager.getEvent('onLoadingEnd').addListener(function() {
            var module = $this.getModule();

            if (module.isRoot()) {
                var serviceManager = module.getServiceManager();
                serviceManager.register('module');
                serviceManager.register('service_container');
                serviceManager.register('parameter_container');
            }
        });

        eventManager.getEvent('onReadyBefore').addListener(function() {
            if ($this.getModule().isRoot()) {
                $this.normalize();
            }
        });
        eventManager.getEvent('onAddPlugin').addListener(function(pluginModule) {
            $this.normalize();
        });
    };

    /**
     * Returns the module instance
     *
     * @method getModule
     * @memberOf Subclass.Service.ServiceManager.prototype
     * @returns {Subclass.Module}
     */
    ServiceManager.prototype.getModule = function()
    {
        return this._module;
    };

    /**
     * Normalizes services.<br /><br />
     *
     * Converts the service definitions to the single format.
     * It's actual in cases when in definition of the service was
     * specified the "extends" option that links to another service.<br /><br />
     *
     * The lacking options in services that extends another service
     * will be added from the parent service
     *
     * @method normalize
     * @memberOf Subclass.Service.ServiceManager.prototype
     *
     * @example
     * ...
     *
     * // Service definitions using extending services
     *
     * var moduleConfis = {
     *      services: {
     *          error: {
     *              abstract: true,
     *              arguments: ["%mode%"],
     *              calls: {
     *                  method1: [arg1, arg2, arg3],
     *                  method2: []
     *              },
     *              tags: ["errorManager"]
     *          },
     *          invalidArgumentError: {
     *              extends: "error",
     *              className: "Name/Of/InvalidArgumentErrorClass"
     *          },
     *          missedArgumentError: {
     *              extends: "error",
     *              className: "Name/Of/MissedArgumentErrorClass"
     *          },
     *          emptyArgumentError: {
     *              extends: "error",
     *              className: "Name/Of/EmptyArgumentErrorClass"
     *          }
     *      }
     * }
     * ...
     *
     * // Will be converted to format:
     *
     * var moduleConfis = {
     *      services: {
     *          error: {
     *              abstract: true,
     *              arguments: ["%mode%"],
     *              calls: {
     *                  method1: [arg1, arg2, arg3],
     *                  method2: []
     *              },
     *              tags: ["errorManager"]
     *          },
     *          invalidArgumentError: {
     *              className: "Name/Of/InvalidArgumentErrorClass"
     *              arguments: ["%mode%"],
     *              calls: {
     *                  method1: [arg1, arg2, arg3],
     *                  method2: []
     *              },
     *              tags: ["errorManager"]
     *          },
     *          missedArgumentError: {
     *              className: "Name/Of/MissedArgumentErrorClass"
     *              arguments: ["%mode%"],
     *              calls: {
     *                  method1: [arg1, arg2, arg3],
     *                  method2: []
     *              },
     *              tags: ["errorManager"]
     *          },
     *          emptyArgumentError: {
     *              className: "Name/Of/EmptyArgumentErrorClass"
     *              arguments: ["%mode%"],
     *              calls: {
     *                  method1: [arg1, arg2, arg3],
     *                  method2: []
     *              },
     *              tags: ["errorManager"]
     *          }
     *      }
     * }
     * ...
     */
    ServiceManager.prototype.normalize = function()
    {
        var serviceDefinitions = this.getServices();

        for (var serviceName in serviceDefinitions) {
            if (!serviceDefinitions.hasOwnProperty(serviceName)) {
                continue;
            }
            var parentServiceName = serviceDefinitions[serviceName].getExtends();
            var definition = serviceDefinitions[serviceName].getDefinition();

            if (parentServiceName) {
                var parentServiceDefinition = this.get(parentServiceName);
                var parentDefinition = Subclass.Tools.copy(parentServiceDefinition.getDefinition());

                if (!definition.abstract) {
                    definition.abstract = false;
                }

                definition = Subclass.Tools.extend(parentDefinition, definition);
                serviceDefinitions[serviceName].setDefinition(definition);
            }
        }
    };

    /**
     * Returns all registered service definitions
     *
     * @method getServices
     * @memberOf Subclass.Service.ServiceManager.prototype
     *
     * @param {boolean} [privateServices = false]
     *      If passed true it returns services only from current module
     *      without services from its plug-ins.
     *
     * @param {boolean} [withParentServices=true]
     *      Should or not will be returned the services from the parent
     *      modules (it is actual if the current module is a plug-in)
     *
     * @returns {Object.<Subclass.Service.Service>}
     *      Returns the plain object which keys are the service names
     *      and values are the service definitions.
     */
    ServiceManager.prototype.getServices = function(privateServices, withParentServices)
    {
        var mainModule = this.getModule();
        var moduleStorage = mainModule.getModuleStorage();
        var serviceDefinitions = {};
        var $this = this;

        if (privateServices !== true) {
            privateServices = false;
        }
        if (withParentServices !== false) {
            withParentServices = true;
        }

        // Returning services from current module with parameters from its parent modules

        if (!privateServices && withParentServices && !mainModule.isRoot() && arguments[2] != mainModule) {
            return mainModule.getRoot().getServiceManager().getServices(false, false, mainModule);

        // Returning services from current module (without its plug-ins)

        } else if (privateServices) {
            return this._services;
        }

        moduleStorage.eachModule(function(module) {
            if (module == mainModule) {
                Subclass.Tools.extend(serviceDefinitions, $this.getServices(true, false));
                return;
            }
            var moduleServiceManager = module.getServiceManager();
            var moduleServices = moduleServiceManager.getServices(false, false);

            Subclass.Tools.extend(serviceDefinitions, moduleServices);
        });

        return serviceDefinitions;
    };

    /**
     * Returns all services tagged by specified tag
     *
     * @method findByTag
     * @memberOf Subclass.Service.ServiceManager.prototype
     *
     * @param {string} tag
     *      The name of service
     *
     * @returns {Array.<Subclass.Service.Service>}
     *      The array of service definitions
     */
    ServiceManager.prototype.findByTag = function(tag)
    {
        var serviceDefinitions = this.getServices();
        var taggedServices = [];

        for (var serviceName in serviceDefinitions) {
            if (!serviceDefinitions.hasOwnProperty(serviceName)) {
                continue;
            }
            var taggedService = serviceDefinitions[serviceName];
            var tags = taggedService.getTags();

            if (tags.indexOf(tag) >= 0 && !taggedService.getAbstract()) {
                taggedServices.push(taggedService);
            }
        }

        return taggedServices;
    };

    /**
     * Returns module names where is defined service with specified name.<br /><br />
     *
     * @method findLocations
     * @memberOf Subclass.Service.ServiceManager.prototype
     *
     * @param {string} serviceName
     *      The name of interesting service
     *
     * @returns {string[]}
     */
    ServiceManager.prototype.findLocations = function(serviceName)
    {
        var mainModule = this.getModule().getRoot();
        var locations = [];

        if (arguments[1]) {
            mainModule = arguments[1];
        }
        var moduleStorage = mainModule.getModuleStorage();

        moduleStorage.eachModule(function(module) {
            var serviceManager = module.getServiceManager();

            if (serviceManager.isset(serviceName, true)) {
                locations.push(module.getName());
            }
            if (module == mainModule) {
                return;
            }
            if (module.hasPlugins()) {
                var pluginModuleStorage = module.getModuleStorage();
                var plugins = pluginModuleStorage.getPlugins();

                for (var i = 0; i < plugins.length; i++) {
                    var subPlugin = plugins[i];
                    var subPluginManager = subPlugin.getServiceManager();
                    var subPluginLocations = subPluginManager.findLocations(serviceName, subPlugin);

                    locations = locations.concat(subPluginLocations);
                }
            }
        });

        return locations;
    };

    /**
     * Renames the service with specified old name to the new one.
     *
     * @method rename
     * @memberOf Subclass.Service.ServiceManager
     *
     * @param {string} nameOld
     *      The old service name
     *
     * @param {string} nameNew
     *      The new service name
     */
    ServiceManager.prototype.rename = function(nameOld, nameNew)
    {
        if (!this.isset(nameOld)) {
            Subclass.Error.create('Trying to rename non existent service "' + nameOld + '".');
        }
        if (!nameNew || typeof nameNew != 'string') {
            Subclass.Error.create('InvalidError')
                .argument('the new service name', false)
                .expected('a string')
                .received(nameNew)
                .apply()
            ;
        }
        var moduleNames = this.findLocations(nameOld);

        for (var i = 0; i < moduleNames.length; i++) {
            var module = Subclass.getModule(moduleNames[i]);
            var serviceManager = module.getServiceManager();
            var services = serviceManager.getServices(true);
            var service = services[nameOld];

            if (!service) {
                Subclass.Error.create(
                    'The work of method ' +
                    '"Subclass.Service.ServiceManager#findLocations" is incorrect.'
                );
            }
            delete services[nameOld];
            services[nameNew] = service;
            service.setName(nameNew);
        }
    };

    /**
     * Registers the new service
     *
     * @method register
     * @memberOf Subclass.Service.ServiceManager.prototype
     *
     * @param {string} serviceName
     *      The name of service
     *
     * @param {Object} [serviceDefinition]
     *      The service configuration
     */
    ServiceManager.prototype.register = function(serviceName, serviceDefinition)
    {
        if (this.getModule().isReady()) {
            Subclass.Error.create('Can\'t define new services when module is ready.');
        }
        if (!serviceDefinition) {
            serviceDefinition = {};
        }

        var service = Subclass.Tools.createClassInstance(
            Subclass.Service.Service, this, serviceName, serviceDefinition
        );
        this._services[serviceName] = service;

        var module = this.getModule();
        var classManager = module.getClassManager();

        if (Subclass.Tools.isEmpty(serviceDefinition)) {
            service.initialize();
        }
        if (serviceDefinition.className) {
            var className = service.getClassName();
            classManager.load(className);
        }

        return service;
    };

    /**
     * Returns service definition instance
     *
     * @method get
     * @memberOf Subclass.Service.ServiceManager.prototype
     *
     * @param {string} serviceName
     *      The service name which definition you want to get
     *
     * @returns {Subclass.Service.Service}
     *      The service definition instance which contains the service configuration data
     */
    ServiceManager.prototype.get = function(serviceName)
    {
        if (!this.isset(serviceName)) {
            Subclass.Error.create('Service with name "' + serviceName + '" is not exists.');
        }
        return this.getServices()[serviceName];
    };

    /**
     * Checks whether service with specified name was ever registered
     *
     * @method isset
     * @memberOf Subclass.Service.ServiceManager.prototype
     *
     * @param {string} serviceName
     *      The name of the service, existence of which you want to check
     *
     * @param {boolean} [privateServices]
     *      If passed true it will search in services only from current module
     *      without services from its plug-ins.
     *
     * @returns {boolean}
     */
    ServiceManager.prototype.isset = function(serviceName, privateServices)
    {
        return !!this.getServices(privateServices)[serviceName];
    };

    return ServiceManager;

}();

// Source file: Error/AbstractServiceError.js

/**
 * @final
 * @class
 * @extends {Subclass.Error}
 * @mixes Subclass.Error.Option.Service
 * @constructor
 * @description
 *
 * The error class which indicates that was attempt to create instance
 * of abstract service
 *
 * @param {string} [message]
 *      The error message
 */
Subclass.Service.Error.AbstractServiceError = (function()
{
    function AbstractServiceError(message)
    {
        AbstractServiceError.$parent.call(this, message);
    }

    AbstractServiceError.$parent = Subclass.Error.ErrorBase;

    AbstractServiceError.$mixins = [
        Subclass.Error.Option.Service
    ];

    /**
     * Returns the name of error type
     *
     * @method getName
     * @memberOf Subclass.Service.Error.AbstractServiceError
     * @static
     *
     * @returns {string}
     */
    AbstractServiceError.getName = function()
    {
        return "AbstractService";
    };

    /**
     * Returns required error fields
     *
     * @method getRequiredOptions
     * @memberOf Subclass.Service.Error.AbstractServiceError
     * @static
     *
     * @returns {Array}
     */
    AbstractServiceError.getRequiredOptions = function()
    {
        var required = AbstractServiceError.$parent.getRequiredOptions();

        return required.concat([
            'service'
        ]);
    };

    /**
     * @inheritDoc
     */
    AbstractServiceError.prototype.buildMessage = function()
    {
        var message = AbstractServiceError.$parent.prototype.buildMessage.call(this);

        if (!message) {
            message += 'You can\'t get/create instance of abstract service "' + this.service() + '".';
        }

        return message;
    };

    // Registering the error type class

    Subclass.Error.registerType(
        AbstractServiceError.getName(),
        AbstractServiceError
    );

    return AbstractServiceError;

})();

// Source file: Error/InvalidServiceOptionError.js

/**
 * @final
 * @class
 * @extends {Subclass.Error}
 * @mixes Subclass.Error.Option.Option
 * @mixes Subclass.Error.Option.Service
 * @mixes Subclass.Error.Option.Expected
 * @mixes Subclass.Error.Option.Received
 * @constructor
 * @description
 *
 * The error class which indicates that was specified invalid option value
 * in the definition of the service
 *
 * @param {string} [message]
 *      The error message
 */
Subclass.Service.Error.InvalidServiceOptionError = (function()
{
    function InvalidServiceOptionError(message)
    {
        InvalidServiceOptionError.$parent.call(this, message);
    }

    InvalidServiceOptionError.$parent = Subclass.Error.ErrorBase;

    InvalidServiceOptionError.$mixins = [
        Subclass.Error.Option.Service,
        Subclass.Error.Option.Option,
        Subclass.Error.Option.Expected,
        Subclass.Error.Option.Received
    ];

    /**
     * Returns the name of error type
     *
     * @method getName
     * @memberOf Subclass.Service.Error.InvalidServiceOptionError
     * @static
     *
     * @returns {string}
     */
    InvalidServiceOptionError.getName = function()
    {
        return "InvalidServiceOption";
    };

    /**
     * Returns required error fields
     *
     * @method getRequiredOptions
     * @memberOf Subclass.Service.Error.InvalidServiceOptionError
     * @static
     *
     * @returns {Array}
     */
    InvalidServiceOptionError.getRequiredOptions = function()
    {
        var required = InvalidServiceOptionError.$parent.getRequiredOptions();

        return required.concat([
            'service',
            'option'
        ]);
    };

    /**
     * @inheritDoc
     */
    InvalidServiceOptionError.prototype.buildMessage = function()
    {
        var message = InvalidServiceOptionError.$parent.prototype.buildMessage.call(this);

        if (!message) {
            message += 'Invalid value of option "' + this.option() + '" ';
            message += 'in definition of service "' + this.service() + '". ';
            message += this.hasExpected() ? ('It must be ' + this.expected() + '. ') : "";
            message += this.hasReceived() ? this.received() : ""
        }

        return message;
    };

    // Registering the error type class

    Subclass.Error.registerType(
        InvalidServiceOptionError.getName(),
        InvalidServiceOptionError
    );

    return InvalidServiceOptionError;

})();

// Source file: Error/Option/Service.js

/**
 * @mixin
 * @description
 *
 * Mixin which allows to specify the service name when creating an error instance.
 */
Subclass.Error.Option.Service = function()
{
    function ServiceOption()
    {
        return {
            /**
             * The name of service
             *
             * @type {(string|undefined)}
             */
            _service: undefined
        };
    }

    /**
     * Sets/returns service name
     *
     * @method service
     * @memberOf Subclass.Error.Option.Service
     *
     * @param {string} [service]
     *      The name of the service
     *
     * @returns {Subclass.Error}
     */
    ServiceOption.prototype.service = function(service)
    {
        if (!arguments.length) {
            return this._service;
        }
        if (service && typeof service != 'string') {
            throw new Error('Specified invalid service name. It must be a string.');
        }
        this._service = service;

        return this;
    };

    /**
     * Checks whether the service option was specified
     *
     * @method hasService
     * @memberOf Subclass.Error.Option.Service
     *
     * @returns {boolean}
     */
    ServiceOption.prototype.hasService = function()
    {
        return this._service !== undefined;
    };

    return ServiceOption;
}();

// Source file: Error/ServiceInitializedError.js

/**
 * @final
 * @class
 * @extends {Subclass.Error}
 * @mixes Subclass.Error.Option.Service
 * @constructor
 * @description
 *
 * The error class which indicates that trying to change the definition of service
 * after it was initialized, i.e. was created an instance of class which was
 * specified in the "className" option.
 *
 * @param {string} [message]
 *      The error message
 */
Subclass.Service.Error.ServiceInitializedError = (function()
{
    function ServiceInitializedError(message)
    {
        ServiceInitializedError.$parent.call(this, message);
    }

    ServiceInitializedError.$parent = Subclass.Error.ErrorBase;

    ServiceInitializedError.$mixins = [
        Subclass.Error.Option.Service
    ];

    /**
     * Returns the name of error type
     *
     * @method getName
     * @memberOf Subclass.Service.Error.ServiceInitializedError
     * @static
     *
     * @returns {string}
     */
    ServiceInitializedError.getName = function()
    {
        return "ServiceInitialized";
    };

    /**
     * Returns required error fields
     *
     * @method getRequiredOptions
     * @memberOf Subclass.Service.Error.ServiceInitializedError
     * @static
     *
     * @returns {Array}
     */
    ServiceInitializedError.getRequiredOptions = function()
    {
        var required = ServiceInitializedError.$parent.getRequiredOptions();

        return required.concat([
            'service'
        ]);
    };

    /**
     * @inheritDoc
     */
    ServiceInitializedError.prototype.buildMessage = function()
    {
        var message = ServiceInitializedError.$parent.prototype.buildMessage.call(this);

        if (!message) {
            message += 'You can\'t modify definition of the service "' + this.service() + '" after it was created.';
        }

        return message;
    };

    // Registering the error type class

    Subclass.Error.registerType(
        ServiceInitializedError.getName(),
        ServiceInitializedError
    );

    return ServiceInitializedError;

})();

// Source file: Extension/ModuleAPIExtension.js

/**
 * @class
 * @constructor
 */
Subclass.Service.Extension.ModuleAPIExtension = function() {

    function ModuleAPIExtension(classInst)
    {
        ModuleAPIExtension.$parent.apply(this, arguments);
    }

    ModuleAPIExtension.$parent = Subclass.Extension;


    //=========================================================================
    //========================== ADDING NEW METHODS ===========================
    //=========================================================================

    var ModuleAPI = Subclass.ModuleAPI;

    /**
    * The same as the {@link Subclass.Module#getServiceManager}
    *
    * @method getServiceManager
    * @memberOf Subclass.ModuleAPI.prototype
    */
    ModuleAPI.prototype.getServiceManager = function()
    {
        return this.getModule().getServiceManager.apply(this.getModule(), arguments);
    };

    /**
    * The same as the {@link Subclass.Service.ServiceManager#registerService}
    *
    * @method registerService
    * @memberOf Subclass.ModuleAPI.prototype
    */
    ModuleAPI.prototype.registerService = function()
    {
        return this.getModule().getServiceManager().register.apply(
            this.getModule().getServiceManager(),
            arguments
        );
    };

    /**
    * The same as the {@link Subclass.SettingsManager#setServices}
    *
    * @method registerServices
    * @memberOf Subclass.ModuleAPI.prototype
    */
    ModuleAPI.prototype.registerServices = function()
    {
        return this.getModule().getSettingsManager().setServices.apply(
            this.getModule().getSettingsManager(),
            arguments
        );
    };

    /**
    * The same as the {@link Subclass.Service.ServiceManager#get}
    *
    * @method getService
    * @memberOf Subclass.ModuleAPI.prototype
    */
    ModuleAPI.prototype.getService = function()
    {
        return this.getModule().getServiceManager().get.apply(
            this.getModule().getServiceManager(),
            arguments
        );
    };

    /**
     * The same as the {@link Subclass.Service.ServiceManager#isset}
     *
     * @method issetService
     * @memberOf Subclass.ModuleAPI.prototype
     */
    ModuleAPI.prototype.issetService = function()
    {
        return this.getModule().getServiceManager().isset.apply(
            this.getModule().getServiceManager(),
            arguments
        );
    };


    //=========================================================================
    //======================== REGISTERING EXTENSION ==========================
    //=========================================================================

    Subclass.Module.onInitializeBefore(function(evt, module)
    {
        ModuleAPI = Subclass.Tools.buildClassConstructor(ModuleAPI);

        if (!ModuleAPI.hasExtension(ModuleAPIExtension)) {
            ModuleAPI.registerExtension(ModuleAPIExtension);
        }
    });

    return ModuleAPIExtension;
}();

// Source file: Extension/ModuleExtension.js

/**
 * @class
 * @constructor
 *
 * Module settings:
 *
 * services     {Object}    opt    List of service definitions.
 *                                 To see more about service
 *                                 definition configuration look at
 *                                 {@link Subclass.Service.Service}
 *
 *                                 Example:
 *
 *                                 var moduleSettings = {
 *                                   ...
 *                                   services: {
 *                                     foo: {
 *                                       className: "Path/Of/FooClass",
 *                                       arguments: ["%mode%]
 *                                     },
 *                                     bar: {
 *                                       className: "Path/Of/BarClass"
 *                                     },
 *                                     ...
 *                                   },
 *                                   ...
 *                                 };
 */
Subclass.Service.Extension.ModuleExtension = function() {

    function ModuleExtension(classInst)
    {
        ModuleExtension.$parent.apply(this, arguments);
    }

    ModuleExtension.$parent = Subclass.Extension;

    /**
     * @inheritDoc
     */
    ModuleExtension.initialize = function(module)
    {
        this.$parent.initialize.apply(this, arguments);

        var eventManager = module.getEventManager();

        eventManager.getEvent('onInitialize').addListener(function(evt, module)
        {
            /**
             * Service manager instance
             *
             * @type {Subclass.Service.ServiceManager}
             * @private
             */
            this._serviceManager = Subclass.Tools.createClassInstance(
                Subclass.Service.ServiceManager,
                this
            );
        });

        eventManager.getEvent('onInitializeAfter').addListener(function(evt, module)
        {
            this.getServiceManager().initialize();
        });
    };


    //=========================================================================
    //========================== ADDING NEW METHODS ===========================
    //=========================================================================

    var Module = Subclass.Module;

    /**
     * Returns an instance of service manager which allows to register, build and
     * get services throughout the project
     *
     * @method getServiceManager
     * @memberOf Subclass.Module.prototype
     *
     * @returns {Subclass.Service.ServiceManager}
     */
    Module.prototype.getServiceManager = function()
    {
        return this._serviceManager;
    };


    //=========================================================================
    //======================== REGISTERING EXTENSION ==========================
    //=========================================================================

    Subclass.Module.onInitializeBefore(function(evt, modulodule)
    {
        if (!Module.hasExtension(ModuleExtension)) {
            Module.registerExtension(ModuleExtension);
        }
    });

    return ModuleExtension;
}();

// Source file: Extension/ModuleInstanceExtension.js

/**
 * @class
 * @constructor
 */
Subclass.Service.Extension.ModuleInstanceExtension = function() {

    function ModuleInstanceExtension(classInst)
    {
        ModuleInstanceExtension.$parent.apply(this, arguments);
    }

    ModuleInstanceExtension.$parent = Subclass.Extension;

    /**
     * @inheritDoc
     *
     * @param {Subclass.ModuleInstance} moduleInstance
     */
    ModuleInstanceExtension.initialize = function(moduleInstance)
    {
        ModuleInstanceExtension.$parent.initialize.apply(this, arguments);

        moduleInstance.getEvent('onInitialize').addListener(function() {

            /**
             * Instance of service container
             *
             * @type {Subclass.Service.ServiceContainer}
             * @private
             */
            this._serviceContainer = Subclass.Tools.createClassInstance(Subclass.Service.ServiceContainer, this);
        });
    };


    //=========================================================================
    //========================== ADDING NEW METHODS ===========================
    //=========================================================================

    var ModuleInstance = Subclass.ModuleInstance;

    /**
     * Returns instance of service container
     *
     * @returns {Subclass.Service.ServiceContainer}
     */
    ModuleInstance.prototype.getServiceContainer = function()
    {
        return this._serviceContainer;
    };


    //=========================================================================
    //======================== REGISTERING EXTENSION ==========================
    //=========================================================================

    Subclass.Module.onInitializeBefore(function(evt, module)
    {
        ModuleInstance = Subclass.Tools.buildClassConstructor(ModuleInstance);

        if (!ModuleInstance.hasExtension(ModuleInstanceExtension)) {
            ModuleInstance.registerExtension(ModuleInstanceExtension);
        }
    });

    return ModuleInstanceExtension;
}();

// Source file: Extension/SettingsManagerExtension.js

/**
 * @class
 * @constructor
 */
Subclass.Service.Extension.SettingsManagerExtension = function() {

    function SettingsManagerExtension(classInst)
    {
        SettingsManagerExtension.$parent.apply(this, arguments);
    }

    SettingsManagerExtension.$parent = Subclass.Extension;


    //=========================================================================
    //========================== ADDING NEW METHODS ===========================
    //=========================================================================

    var SettingsManager = Subclass.SettingsManager;

    /**
     * Registers new services and redefines already existent ones with the same name.
     *
     * @method setServices
     * @memberOf Subclass.SettingsManager.prototype
     *
     * @throws {Error}
     *      Throws error if trying to change value after the module became ready
     *
     * @param {Object.<Object>} services
     *      A plain object which consists of pairs key/value. The keys
     *      are the service names and values are the service definitions.
     *      To see more info about service definition look at
     *      {@link Subclass.Service.Service} class constructor
     *
     * @example
     *
     * var moduleInst = Subclass.createModule("app", {
     *      parameters: {
     *          mode: "dev"
     *      },
     *      ...
     * });
     * ...
     *
     * var moduleSettings = moduleInst.getSettingsManager();
     *
     * // Registering services
     * moduleSettings.setServices({
     *      logger: {
     *          className: "Name/Of/LoggerService", // name of service class
     *          arguments: [ "%mode%" ],            // arguments for service class constructor
     *          calls: {                            // methods that will be called right away after service was created
     *              setParams: [                    // method name
     *                  "param 1 value",            // method argument 1
     *                  "param 2 value"             // method argument 2
     *              ],
     *          }
     *      }
     * });
     * ...
     *
     * // Creating service class
     * moduleInst.registerClass("Name/Of/LoggerService", {
     *      _mode: null,
     *      _param1: null,
     *      _param2: null,
     *
     *      $_constructor: function(mode)
     *      {
     *          this._mode = mode;
     *      },
     *
     *      setParams: function(param1, param2)
     *      {
     *          this._param1 = param1;
     *          this._param2 = param2;
     *      }
     * });
     * ...
     *
     * var logger = moduleInst.getService('logger');
     *
     * var mode = logger._mode;     // "dev"
     * var param1 = logger._param1; // "param 1 value"
     * var param2 = logger._param2; // "param 2 value"
     * ...
     */
    SettingsManager.prototype.setServices = function(services)
    {
        this.checkModuleIsReady();

        if (!services || !Subclass.Tools.isPlainObject(services)) {
            Subclass.Error.create('InvalidModuleOption')
                .option('services')
                .module(this.getModule().getName())
                .received(services)
                .expected('a plain object')
                .apply()
            ;
        }
        var serviceManager = this.getModule().getServiceManager();

        for (var serviceName in services) {
            if (!services.hasOwnProperty(serviceName)) {
                continue;
            }
            serviceManager.register(
                serviceName,
                services[serviceName]
            );
        }
    };

    /**
     * Returns all registered services in the form as they were defined
     *
     * @method getServices
     * @memberOf Subclass.SettingsManager.prototype
     *
     * @returns {Object.<Object>}
     */
    SettingsManager.prototype.getServices = function()
    {
        var services = this.getModule().getServiceManager().getServices();
        var serviceDefinitions = {};

        for (var i = 0; i < services.length; i++) {
            var serviceDefinition = services[i].getDefinition();
            var serviceName = services[i].getName();

            serviceDefinitions[serviceName] = Subclass.Tools.copy(serviceDefinition);
        }
        return serviceDefinitions;
    };


    //=========================================================================
    //======================== REGISTERING EXTENSION ==========================
    //=========================================================================

    Subclass.Module.onInitializeBefore(function(evt, module)
    {
        SettingsManager = Subclass.Tools.buildClassConstructor(SettingsManager);

        if (!SettingsManager.hasExtension(SettingsManagerExtension)) {
            SettingsManager.registerExtension(SettingsManagerExtension);
        }
    });

    return SettingsManagerExtension;
}();

// Source file: Helper/TaggableInterface.js

/**
 * @class
 * @name Subclass.Service.TaggableInterface
 */
Subclass.ClassManager.register("Interface", "Subclass/Service/TaggableInterface", {

    /**
     * Processes tagged services in the way it needs
     *
     * @method processTaggedServices
     * @memberOf Subclass.Service.TaggableInterface.prototype
     *
     * @param {Array} taggedServices
     *      Array of class instances
     */
    processTaggedServices: function(taggedServices) {}
});

// Source file: Parser/ServiceParser.js

/**
 * @class
 * @constructor
 */
Subclass.Parser.ServiceParser = function()
{
    function ServiceParser()
    {
        ServiceParser.$parent.apply(this, arguments);
    }

    ServiceParser.$parent = Subclass.Parser.ParserAbstract;

    /**
     * @inheritDoc
     */
    ServiceParser.getName = function()
    {
        return "service";
    };

    ServiceParser.prototype = {

        /**
         * @inheritDoc
         */
        parse: function(string)
        {
            var serviceName;
            var parserManager = this.getParserManager();
            var moduleInstance = parserManager.getModuleInstance();
            var container = moduleInstance.getServiceContainer();

            if (
                typeof string != 'string'
                || !(serviceName = string.match(/^@([a-z_\.0-9]+)$/i))
            ) {
                return string;
            }
            serviceName = this.getParserManager().parse(serviceName[1]);

            return container.get(serviceName);
        }
    };

    // Registering Parser

    Subclass.Parser.ParserManager.registerParser(ServiceParser);

    return ServiceParser;
}();

// Source file: Service.js

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
 *                                       it using serviceManager.get()
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
        this._name = null;

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


        // Init operations

        this.setName(serviceName);
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
     * Sets the name of service.
     *
     * This method is actual only at init stage.
     * If you really want to change service name you should use
     * the {@link Subclass.Service.Service#rename} method.
     *
     * @method setName
     * @memberOf Subclass.Service.Service.prototype
     *
     * @param {string} name
     *      The name of service
     */
    Service.prototype.setName = function(name)
    {
        var regExp = /^[0-9_\.a-z]+$/i;

        if (!name || typeof name != 'string' || !name.match(regExp)) {
            Subclass.Error.create('InvalidArgument')
                .argument('the name of service', false)
                .expected('a string and should match regular expression ' + regExp)
                .received(name)
                .apply()
            ;
        }
        this._name = name;
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
     *
     * In this stage the service configuration will be validated and performed.<br />
     * It method should be invoked once before the service instance will be created.
     *
     * @method initialize
     * @memberOf Subclass.Service.Service.prototype
     */
    Service.prototype.initialize = function()
    {
        if (!this.isInitialized()) {
            this.validateDefinition();
            this.processDefinition();
        }
    };

    /**
     * Renames current service
     *
     * @method rename
     * @memberOf Subclass.Service.Service.prototype
     *
     * @param {string} name
     *      The new name of current service
     */
    Service.prototype.rename = function(name)
    {
        this.getServiceManager().rename(this.getName(), name);
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
        return this.normalizeClassName(this.getDefinition().className);
    };

    /**
     * Normalizes name of service class
     *
     * @param {string} className
     *      The name of service class
     *
     * @returns {string}
     */
    Service.prototype.normalizeClassName = function(className)
    {
        var paramRegExp = /%([^%]+)%/i;

        if (paramRegExp.test(className)) {
            var paramManager = this.getServiceManager().getModule().getParameterManager();
            var paramName = className.match(paramRegExp)[1];
            var param = paramManager.get(paramName);

            className = className.replace(paramRegExp, param);
        }
        return className;
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
     * Allows to pass needed argument to needed index
     * to service class constructor function when it is created
     *
     * @method addArgument
     * @memberOf Subclass.Service.Service.prototype
     *
     * @param {number} argIndex
     *      The index of argument place in list of service class constructor arguments
     *
     * @param {*} argValue
     *      The argument value
     */
    Service.prototype.addArgument = function(argIndex, argValue)
    {
        if (this.isInitialized()) {
            Subclass.Error.create('ServiceInitialized')
                .service(this.getName())
                .apply()
            ;
        }
        if (typeof argIndex != 'number') {
            Subclass.Error.create('InvalidArgument')
                .argument('the index of new service constructor argument', false)
                .expect('a number')
                .received(argIndex)
                .apply()
            ;
        }
        this.getDefinition().arguments[argIndex] = argValue;
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
     * @param {Array} args
     *      An array of arguments for the service class constructor
     *      or its methods
     *
     * @param {Subclass.Parser.ParserManager} parser
     */
    Service.prototype.normalizeArguments = function(args, parser)
    {
        if (!args) {
            return [];
        }
        args = Subclass.Tools.extend([], args);

        for (var i = 0; i < args.length; i++) {
            args[i] = parser.parse(args[i]);
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
     * Adds new call injection to "calls" option
     *
     * @method addCall
     * @memberOf Subclass.Service.Service.prototype
     *
     * @param {string} methodName
     *      The name of method in service class
     *
     * @param {Array} [methodArgs=[]]
     *      The array of methods arguments
     */
    Service.prototype.addCall = function(methodName, methodArgs)
    {
        if (this.isInitialized()) {
            Subclass.Error.create('ServiceInitialized')
                .service(this.getName())
                .apply()
            ;
        }
        if (!methodName || typeof methodName != 'string') {
            Subclass.Error.create('InvalidArgument')
                .argument('the name of callable method', false)
                .expected('a string')
                .received(methodName)
                .apply()
            ;
        }
        if (arguments.length > 1 && !Array.isArray(methodArgs)) {
            Subclass.Error.create('InvalidArgument')
                .argument('the methods arguments', false)
                .expected('an array')
                .received(methodArgs)
                .apply()
            ;
        }
        if (!methodArgs) {
            methodArgs = [];
        }
        this.getDefinition().calls[methodName] = methodArgs;
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
     * @param {Subclass.Parser.ParserManager} parser
     *
     * @returns {Object.<Array>}
     */
    Service.prototype.normalizeCalls = function(calls, parser)
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
                calls[methodName] = this.normalizeArguments(calls[methodName], parser);
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

        // Checking methods existence which are specified in the calls option

        var className = this.getClassName();

        if (className) {
            var classManager = serviceManager.getModule().getClassManager();
            var classDef = classManager.get(className).getDefinition();

            for (methodName in calls) {
                if (calls.hasOwnProperty(methodName)) {
                    if (!classDef.getData().hasOwnProperty(methodName)) {
                        Subclass.Error.create(
                            'Specified invalid "calls" option in the service "' + this.getName() + '". ' +
                            'The method "' + methodName + '" does not exist in class "' + className + '".'
                        );
                    }
                }
            }
        }

        // Validating for circular dependency injection in "calls" and "arguments" service options

        function validateArguments(arg, argType)
        {
            if (typeof arg == 'string' && arg.match(/^@[a-z_0-9]+$/i)) {
                var serviceName = arg.substr(1);
                var service = serviceManager.get(serviceName);

                if ((
                        !service.isSingleton()
                        && tags.indexOf(serviceName) >= 0
                    ) || (
                        argType != 'calls'
                        && !service.isSingleton()
                        && serviceName == chain[0]
                    ) || (
                        argType == 'arguments'
                        && serviceName == chain[0]
                    )
                ) {
                    Subclass.Error.create(
                        'Can\'t create instance of service "' + $this.getName() + '". ' +
                        'Circular dependency injection was found.'
                    );
                }
                if (chain.indexOf(serviceName) <= 0) {
                    chain.concat(service.validateDefinition(chain));
                }
            }
        }

        // Validating arguments

        for (var i = 0; i < args.length; i++) {
            validateArguments(args[i], 'arguments');
        }

        // Validating calls

        for (var methodName in calls) {
            if (calls.hasOwnProperty(methodName)) {
                for (i = 0; i < calls[methodName].length; i++) {
                    validateArguments(calls[methodName][i], 'calls');
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

// Source file: ServiceContainer.js

/**
 * @class
 * @constructor
 */
Subclass.Service.ServiceContainer = function()
{
    function ServiceContainer(moduleInstance)
    {
        if (!moduleInstance || !(moduleInstance instanceof Subclass.ModuleInstance)) {
            Subclass.Error.create('InvalidArgument')
                .argument('the module instance', false)
                .expected('an instance of class "Subclass.ModuleInstance"')
                .received(moduleInstance)
                .apply()
            ;
        }

        /**
         * The module instance object
         *
         * @type {Subclass.ModuleInstance}
         * @private
         */
        this._moduleInstance = moduleInstance;

        /**
         * The module API instance
         *
         * @type {Subclass.ModuleAPI}
         * @private
         */
        this._module = moduleInstance.getModule();

        /**
         * Instance of service factory
         *
         * @type {Subclass.Service.ServiceFactory}
         * @private
         */
        this._serviceFactory = Subclass.Tools.createClassInstance(Subclass.Service.ServiceFactory, this);

        /**
         * Collection of service class instances
         *
         * @type {Object.<Object>}
         * @private
         */
        this._services = {};

        /**
         * List of registered events
         *
         * @type {Array}
         * @private
         */
        this._events = [];

        /**
         * Indicates whether service manager was initialized
         *
         * @type {boolean}
         * @private
         */
        this._initialized = false;


        // Initialization operations

        this.registerEvent('onInitialize');
        this.initialize();
    }

    ServiceContainer.$parent = Subclass.Extendable;

    ServiceContainer.$mixins = [Subclass.Event.EventableMixin];

    ServiceContainer.prototype = {

        /**
         * Initializes service container
         */
        initialize: function()
        {
            if (this.isInitialized()) {
                Subclass.Error.create('Service container is already initialized!')
            }

            // Adding service instances

            Subclass.Tools.extend(this._services, {
                module: this._module,
                service_container: this,
                parameter_container: this._moduleInstance.getParameterContainer()
            });

            // Initializing

            this.initializeExtensions();
            this.getEvent('onInitialize').trigger();
            this._initialized = true;
        },

        /**
         * Reports whether service container was initialized
         *
         * @returns {boolean}
         */
        isInitialized: function()
        {
            return this._initialized;
        },

        /**
         * Returns module definition instance
         *
         * @returns {Subclass.Module}
         */
        getModule: function()
        {
            return this._module;
        },

        /**
         * Returns module instance
         *
         * @returns {Subclass.ModuleInstance}
         */
        getModuleInstance: function()
        {
            return this._moduleInstance;
        },

        /**
         * Returns instance of service manager
         *
         * @returns {Subclass.Service.ServiceManager}
         */
        getServiceManager: function()
        {
            return this.getModule().getServiceManager();
        },

        /**
         * Stores service instance
         *
         * @param {string} serviceName
         * @param {Object} serviceInstance
         */
        setServiceInstance: function(serviceName, serviceInstance)
        {
            if (this.isServiceCreated(serviceName)) {
                Subclass.Error.create(
                    'Trying to replace already created ' +
                    'instance of service "' + serviceName + '"'
                );
            }
            this._services[serviceName] = serviceInstance;
        },

        /**
         * Returns service instance
         *
         * @param {string} serviceName
         * @returns {null|Object}
         */
        getServiceInstance: function(serviceName)
        {
            if (!this.isServiceCreated(serviceName)) {
                return null;
            }
            return this._services[serviceName];
        },

        /**
         * Checks whether service instance was created
         *
         * @param {string} serviceName
         * @returns {boolean}
         */
        isServiceCreated: function(serviceName)
        {
            return this._services.hasOwnProperty(serviceName);
        },

        /**
         * The same as the {@link Subclass.Service.ServiceManager#getServices}
         *
         * @returns {Object.<Subclass.Service.Service>}
         */
        getServices: function()
        {
            return this.getServiceManager().getServices();
        },

        /**
         * Creates (if needed) and returns service instance object
         *
         * @param {string} serviceName
         * @returns {Object}
         */
        get: function(serviceName)
        {
            if (this.isServiceCreated(serviceName)) {
                return this.getServiceInstance(serviceName);
            }
            var service = this.getServiceManager().get(serviceName);
            var serviceInst = this._serviceFactory.createService(service);

            // Saving service instance

            if (service.isSingleton()) {
                this.setServiceInstance(serviceName, serviceInst);
            }

            // Processing calls after service instance was created and saved

            var parserManager = this.getModuleInstance().getParser();
            var calls = service.normalizeCalls(service.getCalls(), parserManager);

            for (var methodName in calls) {
                if (!calls.hasOwnProperty(methodName)) {
                    continue;
                }
                serviceInst[methodName].apply(
                    serviceInst,
                    calls[methodName]
                );
            }

            // Processing tags after service instance was created and saved

            if (serviceInst.isImplements('Subclass/Service/TaggableInterface')) {
                var taggedServiceInstances = this.findByTag(service.getName());
                serviceInst.processTaggedServices(taggedServiceInstances);
            }

            return serviceInst;
        },

        /**
         * The same as the {@link Subclass.Service.ServiceManager#isset}
         *
         * @param {string} serviceName
         * @returns {boolean}
         */
        isset: function(serviceName)
        {
            return this.getServiceManager().isset(serviceName);
        },

        /**
         * Searches and returns service instances by specified tag
         *
         * @param {string} serviceName
         * @returns {Array.<Subclass.Service.Service>}
         */
        findByTag: function(serviceName)
        {
            var services = this.getServiceManager().findByTag(serviceName);
            var $this = this;

            services.map(function(service, index, arr) {
                arr[index] = $this.get(service.getName());
            });

            return services;
        }
    };

    return ServiceContainer;
}();

// Source file: ServiceFactory.js

/**
 * @class
 * @constructor
 * @description
 *
 * The class which instance is the factory for the services
 *
 * @throws {Error}
 *      Throws error if specified not valid service manager instance
 *
 * @param {Subclass.Service.ServiceContainer} container
 *      The instance of service manager
 */
Subclass.Service.ServiceFactory = (function()
{
    /**
     * @alias Subclass.Service.ServiceFactory
     */
    function ServiceFactory(container)
    {
        if (!container || !(container instanceof Subclass.Service.ServiceContainer)) {
            Subclass.Error.create('InvalidArgument')
                .argument('the service manager instance', false)
                .expected('an instance of Subclass.Service.ServiceManager')
                .received(container)
                .apply()
            ;
        }

        /**
         * @type {Subclass.Service.ServiceContainer}
         * @private
         */
        this._serviceContainer = container;
    }

    /**
     * Returns service container instance
     *
     * @method getServiceContainer
     * @memberOf Subclass.Service.ServiceFactory.prototype
     *
     * @returns {Subclass.Service.ServiceContainer}
     */
    ServiceFactory.prototype.getServiceContainer = function()
    {
        return this._serviceContainer;
    };

    /**
     * Creates and returns the service class instance
     *
     * @method createService
     * @memberOf Subclass.Service.ServiceFactory.prototype
     *
     * @param {Subclass.Service.Service} service
     */
    ServiceFactory.prototype.createService = function(service)
    {
        if (service.getAbstract()) {
            Subclass.Error.create('AbstractService')
                .service(service.getName())
                .apply()
            ;
        }

        var container = this.getServiceContainer();
        var moduleInstance = container.getModuleInstance();
        var parserManager = moduleInstance.getParser();
        var serviceManager = container.getServiceManager();
        var classManager = serviceManager.getModule().getClassManager();

        // Initializing service

        service.initialize();

        // Creating class instance

        var classDef = classManager.get(service.getClassName());
        var classArguments = service.normalizeArguments(service.getArguments(), parserManager);

        return classDef.createInstance.apply(classDef, classArguments);
    };

    return ServiceFactory;

})();

// Source file: Subclass.js

/**
 * Registers the new SubclassJS plug-in
 */
Subclass.registerPlugin(function() {

    function ServicePlugin()
    {
        ServicePlugin.$parent.call(this);
    }

    ServicePlugin.$parent = Subclass.SubclassPlugin;

    /**
     * @inheritDoc
     */
    ServicePlugin.getName = function()
    {
        return "SubclassService";
    };

    /**
     * @inheritDoc
     */
    ServicePlugin.getDependencies = function()
    {
        return [
            'SubclassParser',
            'SubclassInstance',
            'SubclassParameter'
        ];
    };

    return ServicePlugin;
}());
})();