define(function (require, exports, module) {

    var bootstrap = require('application/bootstrap'),
        templet_report = require('lib/text!application/templet/report.html');

    exports.bootstrap_init = function () {
        exports.init();
    }
    exports.init = function () {
        bootstrap.component_menu_active('report');
        bootstrap.bootstrap_initWorkspace();
        //bootstrap.bootstrap_showLoading();
        bootstrap.bootstrap_initMain(function () {
            bootstrap.bootstrap_push('数据报告', '/report');
            $('#workspace').html(Handlebars.compile(templet_report)({}));
        });
    };
});