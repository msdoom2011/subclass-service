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
                .expected('an instance of class Subclass.ModuleInstance')
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
        this._services = {
            module: this._module,
            service_container: this,
            service_manager: this._module.getServiceManager(),
            parameter_manager: this._module.getParameterManager(),
            class_manager: this._module.getClassManager(),
            event_manager: this._module.getEventManager(),
            load_manager: this._module.getEventManager(),
            settings_manager: this._module.getEventManager(),
            module_storage: this._module.getEventManager()
        };

        /**
         * List of registered events
         *
         * @type {Array}
         * @private
         */
        this._events = [];


        // Initialization operations

        this.registerEvent('onInitialize');
        this.initializeExtensions();
        this.getEvent('onInitialize').trigger();
    }

    ServiceContainer.$parent = Subclass.Extendable;

    ServiceContainer.$mixins = [Subclass.Event.EventableMixin];

    ServiceContainer.prototype = {

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
         * Returns instance of parameter manager
         *
         * @returns {*|Subclass.Parameter.ParameterManager}
         */
        getParameterManager: function()
        {
            return this.getModule().getParameterManager();
        },

        /**
         * Returns value of parameter with specified name
         *
         * @param {string} paramName
         * @returns {*}
         */
        getParameter: function(paramName)
        {
            return this.getParameterManager().getParameter(paramName);
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
            var registeredServices = this.getServiceManager().getServices();
            var containerServices = this._services;

            for (var serviceName in containerServices) {
                if (
                    containerServices.hasOwnProperty(serviceName)
                    && !registeredServices.hasOwnProperty(serviceName)
                ) {
                    registeredServices[serviceName] = containerServices[serviceName];
                }
            }
            return registeredServices;
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

            if (service.isSingleton()) {
                this.setServiceInstance(serviceName, serviceInst);
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
