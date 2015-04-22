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