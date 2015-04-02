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
        Subclass.Error.call(this, message);
    }

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
     * Returns all available error type options
     *
     * @method getOptions
     * @memberOf Subclass.Service.Error.ServiceInitializedError
     * @static
     *
     * @returns {Array}
     */
    ServiceInitializedError.getOptions = function()
    {
        var options = Subclass.Error.getOptions();

        return options.concat([
            'service'
        ]);
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
        var required = Subclass.Error.getRequiredOptions();

        return required.concat([
            'service'
        ]);
    };

    /**
     * @inheritDoc
     */
    ServiceInitializedError.prototype.buildMessage = function()
    {
        var message = Subclass.Error.prototype.buildMessage.call(this);

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