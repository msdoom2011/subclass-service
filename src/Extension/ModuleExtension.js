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