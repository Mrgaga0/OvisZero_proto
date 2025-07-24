/**
 * CSInterface - Adobe CEP JavaScript Interface
 * Simplified version for basic CEP functionality
 */

var CSInterface = (function () {
    'use strict';
    
    function CSInterface() {
        this.hostEnvironment = JSON.parse(window.__adobe_cep__.getHostEnvironment());
    }
    
    /**
     * Eval ExtendScript
     */
    CSInterface.prototype.evalScript = function(script, callback) {
        if(callback === null || callback === undefined) {
            callback = function(result) {};
        }
        window.__adobe_cep__.evalScript(script, callback);
    };
    
    /**
     * Get system path
     */
    CSInterface.prototype.getSystemPath = function(pathType) {
        var SystemPath = {
            USER_DATA: "userData",
            COMMON_FILES: "commonFiles",
            MY_DOCUMENTS: "myDocuments",
            APPLICATION: "application",
            EXTENSION: "extension",
            HOST_APPLICATION: "hostApplication"
        };
        
        return window.__adobe_cep__.getSystemPath(pathType);
    };
    
    /**
     * Open URL in default browser
     */
    CSInterface.prototype.openURLInDefaultBrowser = function(url) {
        if (window.__adobe_cep__.openURLInDefaultBrowser) {
            return window.__adobe_cep__.openURLInDefaultBrowser(url);
        }
        return false;
    };
    
    /**
     * Get extension ID
     */
    CSInterface.prototype.getExtensionID = function() {
        return window.__adobe_cep__.getExtensionId();
    };
    
    /**
     * Close extension
     */
    CSInterface.prototype.closeExtension = function() {
        window.__adobe_cep__.closeExtension();
    };
    
    /**
     * Register event listener
     */
    CSInterface.prototype.addEventListener = function(type, listener, obj) {
        window.__adobe_cep__.addEventListener(type, listener, obj);
    };
    
    /**
     * Remove event listener
     */
    CSInterface.prototype.removeEventListener = function(type, listener, obj) {
        window.__adobe_cep__.removeEventListener(type, listener, obj);
    };
    
    /**
     * Dispatch event
     */
    CSInterface.prototype.dispatchEvent = function(event) {
        if (typeof event.data === "object") {
            event.data = JSON.stringify(event.data);
        }
        
        window.__adobe_cep__.dispatchEvent(event);
    };
    
    return CSInterface;
})();

// Make CSInterface available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CSInterface;
}