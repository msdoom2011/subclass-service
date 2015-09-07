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