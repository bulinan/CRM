define(function (require, exports, module) {

    var bootstrap = require('application/bootstrap'),
        templet_plugin = require('lib/text!application/templet/plugin.html');

    exports.bootstrap_init = function () {
        exports.init();
    }
    exports.init = function () {
        bootstrap.component_menu_active('plugin');
        bootstrap.bootstrap_initWorkspace();
        //bootstrap.bootstrap_showLoading();
        bootstrap.bootstrap_initMain(function(){
            bootstrap.bootstrap_push('应用程序', '/plugin');
            $('#workspace').html(Handlebars.compile(templet_plugin)({}));
        });
    };
});