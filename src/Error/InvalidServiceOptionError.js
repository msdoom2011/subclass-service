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
        Subclass.Error.call(this, message);
    }

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
     * Returns all available error type options
     *
     * @method getOptions
     * @memberOf Subclass.Service.Error.InvalidServiceOptionError
     * @static
     *
     * @returns {Array}
     */
    InvalidServiceOptionError.getOptions = function()
    {
        var options = Subclass.Error.getOptions();

        return options.concat([
            'option',
            'service',
            'expected',
            'received'
        ]);
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
        var required = Subclass.Error.getRequiredOptions();

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
        var message = Subclass.Error.prototype.buildMessage.call(this);

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