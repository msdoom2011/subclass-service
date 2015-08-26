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
         * Instance of service factory
         *
         * @type {Subclass.Service.ServiceFactory}
         * @private
         */
        this._serviceFactory = Subclass.Tools.createClassInstance(Subclass.Service.ServiceFactory, this);

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
                serviceManager.registerService('service_manager', module.getServiceManager());
                serviceManager.registerService('class_manager', module.getClassManager());
                serviceManager.registerService('event_manager', module.getEventManager());
                serviceManager.registerService('load_manager', module.getEventManager());
                serviceManager.registerService('settings_manager', module.getEventManager());
                serviceManager.registerService('module_storage', module.getEventManager());
            }
        });

        eventManager.getEvent('onReadyBefore').addListener(function() {
            if ($this.getModule().isRoot()) {
                $this.normalizeServices();
            }
        });
        eventManager.getEvent('onAddPlugin').addListener(function(pluginModule) {
            $this.normalizeServices();
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
     * Returns the service factory instance
     *
     * @method getModule
     * @memberOf Subclass.Service.ServiceManager.prototype
     * @returns {Subclass.Service.ServiceFactory}
     */
    ServiceManager.prototype.getServiceFactory = function()
    {
        return this._serviceFactory;
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
     * @method normalizeServices
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
    ServiceManager.prototype.normalizeServices = function()
    {
        var serviceDefinitions = this.getServices();

        for (var serviceName in serviceDefinitions) {
            if (
                !serviceDefinitions.hasOwnProperty(serviceName)
                || !(serviceDefinitions[serviceName] instanceof Subclass.Service.Service)
            ) {
                continue;
            }
            var parentServiceName = serviceDefinitions[serviceName].getExtends();
            var definition = serviceDefinitions[serviceName].getDefinition();

            if (parentServiceName) {
                var parentServiceDefinition = this.getServiceDefinition(parentServiceName);
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
     * @method getServicesByTag
     * @memberOf Subclass.Service.ServiceManager.prototype
     *
     * @param {string} tag
     *      The name of service
     *
     * @returns {Array.<Subclass.Service.Service>}
     *      The array of service definitions
     */
    ServiceManager.prototype.getServicesByTag = function(tag)
    {
        var serviceDefinitions = this.getServices();
        var taggedServices = [];

        for (var serviceName in serviceDefinitions) {
            if (
                !serviceDefinitions.hasOwnProperty(serviceName)
                || !(serviceDefinitions[serviceName] instanceof Subclass.Service.Service)
            ) {
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
     * @method getServiceLocations
     * @memberOf Subclass.Service.ServiceManager.prototype
     *
     * @param {string} serviceName
     *      The name of interesting service
     *
     * @returns {string[]}
     */
    ServiceManager.prototype.getServiceLocations = function(serviceName)
    {
        var mainModule = this.getModule().getRoot();
        var locations = [];

        if (arguments[1]) {
            mainModule = arguments[1];
        }
        var moduleStorage = mainModule.getModuleStorage();

        moduleStorage.eachModule(function(module) {
            var serviceManager = module.getServiceManager();

            if (serviceManager.issetService(serviceName, true)) {
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
                    var subPluginLocations = subPluginManager.getServiceLocations(serviceName, subPlugin);

                    locations = locations.concat(subPluginLocations);
                }
            }
        });

        return locations;
    };

    /**
     * Registers the new service
     *
     * @method registerService
     * @memberOf Subclass.Service.ServiceManager.prototype
     *
     * @param {string} serviceName
     *      The name of service
     *
     * @param {Object} serviceDefinition
     *      The service configuration
     */
    ServiceManager.prototype.registerService = function(serviceName, serviceDefinition)
    {
        var service;

        if (this.getModule().isReady()) {
            Subclass.Error.create('Can\'t define new services when module is ready.');
        }

        if (
            serviceDefinition
            && typeof serviceDefinition == 'object'
            && !Subclass.Tools.isPlainObject(serviceDefinition)
        ) {
            service = serviceDefinition;

        } else {
            service = Subclass.Tools.createClassInstance(
                Subclass.Service.Service, this, serviceName, serviceDefinition
            );
            var classManager = this.getModule().getClassManager();

            if (serviceDefinition.className) {
                var className = service.normalizeClassName(serviceDefinition.className);
                classManager.loadClass(className);
            }
        }

        return this._services[serviceName] = service;
    };

    /**
     * Returns service class instance.<br /><br />
     *
     * Depending on singleton marker will be returned the same
     * or the new instance every time you request the service.
     *
     * @method getService
     * @memberOf Subclass.Service.ServiceManager.prototype
     *
     * @param {string} serviceName
     *      The name of service which instance you want to get
     *
     * @returns {Object}
     *      Returns the instance of class specified in the "className" service option
     */
    ServiceManager.prototype.getService = function(serviceName)
    {
        if (!this.issetService(serviceName)) {
            Subclass.Error.create('Service with name "' + serviceName + '" is not exists.');
        }
        var serviceDef = this.getServices()[serviceName];

        if (
            serviceDef
            && typeof serviceDef == 'object'
            && !(serviceDef instanceof Subclass.Service.Service)
        ) {
            return serviceDef;

        } else {
            return this.getServiceFactory().getService(serviceDef);
        }
    };

    /**
     * Returns service definition instance
     *
     * @method getServiceDefinition
     * @memberOf Subclass.Service.ServiceManager.prototype
     *
     * @param {string} serviceName
     *      The service name which definition you want to get
     *
     * @returns {Subclass.Service.Service}
     *      The service definition instance which contains the service configuration data
     */
    ServiceManager.prototype.getServiceDefinition = function(serviceName)
    {
        if (!this.issetService(serviceName)) {
            Subclass.Error.create('Service with name "' + serviceName + '" is not exists.');
        }
        return this.getServices()[serviceName];
    };

    /**
     * Renames the service with specified old name to the new one.
     *
     * @method renameService
     * @memberOf Subclass.Service.ServiceManager
     *
     * @param {string} nameOld
     *      The old service name
     *
     * @param {string} nameNew
     *      The new service name
     */
    ServiceManager.prototype.renameService = function(nameOld, nameNew)
    {
        if (!this.issetService(nameOld)) {
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
        var moduleNames = this.getServiceLocations(nameOld);

        for (var i = 0; i < moduleNames.length; i++) {
            var module = Subclass.getModule(moduleNames[i]);
            var serviceManager = module.getServiceManager();
            var services = serviceManager.getServices(true);
            var service = services[nameOld];

            if (!service) {
                Subclass.Error.create(
                    'The work of method ' +
                    '"Subclass.Service.ServiceManager#getServiceLocations" is incorrect.'
                );
            }
            delete services[nameOld];
            services[nameNew] = service;

            if (service instanceof Subclass.Service.Service) {
                service.setName(nameNew);
            }
        }
    };

    /**
     * Checks whether service with specified name was ever registered
     *
     * @method issetService
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
    ServiceManager.prototype.issetService = function(serviceName, privateServices)
    {
        return !!this.getServices(privateServices)[serviceName];
    };

    return ServiceManager;

}();