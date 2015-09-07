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
                service_manager: this._module.getServiceManager(),
                parameter_container: this._moduleInstance.getParameterContainer(),
                parameter_manager: this._module.getParameterManager(),
                class_manager: this._module.getClassManager(),
                event_manager: this._module.getEventManager(),
                load_manager: this._module.getEventManager(),
                settings_manager: this._module.getEventManager(),
                module_storage: this._module.getEventManager()
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
