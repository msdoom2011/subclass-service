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
 * @param {Subclass.Service.ServiceManager} serviceManager
 *      The instance of service manager
 */
Subclass.Service.ServiceFactory = (function()
{
    /**
     * @alias Subclass.Service.ServiceFactory
     */
    function ServiceFactory(container)
    {
        //if (!serviceManager || !(serviceManager instanceof Subclass.Service.ServiceManager)) {
        //    Subclass.Error.create('InvalidArgument')
        //        .argument('the service manager instance', false)
        //        .received(serviceManager)
        //        .expected('an instance of Subclass.Service.ServiceManager')
        //        .apply()
        //    ;
        //}
        ///**
        // * Service manager instance
        // *
        // * @type {Subclass.Service.ServiceManager}
        // */
        //this._serviceManager = serviceManager;

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
        this._container = container;
    }
    //
    ///**
    // * Returns service manager instance
    // *
    // * @method getServiceManager
    // * @memberOf Subclass.Service.ServiceFactory.prototype
    // *
    // * @returns {Subclass.Service.ServiceManager}
    // */
    //ServiceFactory.prototype.getServiceManager = function()
    //{
    //    return this._serviceManager;
    //};

    /**
     * Returns service container instance
     *
     * @method getContainer
     * @memberOf Subclass.Service.ServiceFactory.prototype
     *
     * @returns {Subclass.Service.ServiceContainer}
     */
    ServiceFactory.prototype.getContainer = function()
    {
        return this._container;
    };

    ///**
    // * Returns the service class instance.<br /><br />
    // *
    // * If the passed service definition was not initialized
    // * it will be initialized and will be created and returned
    // * the new instance of the service.<br /><br />
    // *
    // * If the passed service definition was initialized
    // * and it is marked as singleton the early created
    // * instance will be returned without creating the new one.<br /><br />
    // *
    // * If the service is not singleton then every time
    // * will be returned the new instance of service.
    // *
    // * @method getService
    // * @memberOf Subclass.Service.ServiceFactory.prototype
    // *
    // * @throws {Error}
    // *      Throws error if trying to get instance of abstract service
    // *
    // * @param {Subclass.Service.Service} serviceName
    // *      The instance of definition of service
    // *      (the instance of class which contains the service configuration)
    // *
    // * @returns {Object}
    // */
    ////ServiceFactory.prototype.getService = function(serviceDefinition)
    //ServiceFactory.prototype.getService = function(serviceName)
    //{
    //    var container = this.getContainer();
    //    var serviceManager = container.getServiceManager();
    //    var service = serviceManager.get(serviceName);
    //    var firstCreation = false;
    //
    //    //if (!(service instanceof Subclass.Service.Service)) {
    //    //    Subclass.Error.create('InvalidArgument')
    //    //        .argument('the service definition instance', false)
    //    //        .expected('an instance of class Subclass.Service.Service')
    //    //        .received(serviceDefinition)
    //    //        .apply()
    //    //    ;
    //    //}
    //    if (service.getAbstract()) {
    //        Subclass.Error.create('AbstractService')
    //            .service(service.getName())
    //            .apply()
    //        ;
    //    }
    //    if (container.isServiceCreated(serviceName)) {
    //        return container.getServiceInstance(serviceName);
    //    }
    //    if (!service.isInitialized()) {
    //        service.initialize();
    //    }
    //
    //    return this.createService(service);
    //
    //
    //    //if (service.isInitialized() && service.isSingleton()) {
    //    //    return service.getInstance();
    //    //}
    //    //if (!service.isInitialized()) {
    //    //    service.initialize();
    //    //    firstCreation = true;
    //    //}
    //    //
    //    //var serviceClassInst = this.createService(service);
    //    //
    //    //if (firstCreation) {
    //    //    service.setInstance(serviceClassInst);
    //    //}
    //    //
    //    //return serviceClassInst;
    //};

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

        var container = this.getContainer();
        var moduleInstance = container.getModuleInstance();
        var parserManager = moduleInstance.getParser();
        var serviceManager = container.getServiceManager();
        var classManager = serviceManager.getModule().getClassManager();

        // Initializing service
        service.initialize();

        // Creating class instance

        var classDef = classManager.get(service.getClassName());
        var classArguments = service.normalizeArguments(service.getArguments(), parserManager);
        var classInst = classDef.createInstance.apply(classDef, classArguments);

        // Processing calls

        var calls = service.normalizeCalls(service.getCalls(), parserManager);

        for (var methodName in calls) {
            if (!calls.hasOwnProperty(methodName)) {
                continue;
            }
            classInst[methodName].apply(
                classInst,
                calls[methodName]
            );
        }

        // Processing tags

        if (classInst.isImplements('Subclass/Service/TaggableInterface')) {
            var taggedServiceInstances = container.findByTag(service.getName());
            classInst.processTaggedServices(taggedServiceInstances);
        }

        return classInst;
    };

    return ServiceFactory;

})();