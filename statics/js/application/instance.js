require.config({
    baseUrl: '/statics/js/',
    paths: {
        'jquery': 'lib/jquery.min',
        'Handlebars': 'lib/handlebars-v1.3.0',
        'router': 'lib/router.min',
        'amcharts'          : 'lib/amcharts/amcharts',
        'amcharts.funnel'   : 'lib/amcharts/funnel',
        'amcharts.gauge'    : 'lib/amcharts/gauge',
        'amcharts.pie'      : 'lib/amcharts/pie',
        'amcharts.radar'    : 'lib/amcharts/radar',
        'amcharts.serial'   : 'lib/amcharts/serial',
        'amcharts.xy'       : 'lib/amcharts/xy',
        'datatables'        : 'lib/dataTables/jquery.dataTables',
        //'ColReorder'        : 'lib/ColReorderWithResize',
        'cookie'            : 'lib/jquery.cookie'
    },
    shim: {
        'amcharts.funnel'   : {
            deps: ['amcharts'],
            exports: 'AmCharts',
            init: function() {
                AmCharts.isReady = true;
            }
        },
        'amcharts.gauge'    : {
            deps: ['amcharts'],
            exports: 'AmCharts',
            init: function() {
                AmCharts.isReady = true;
            }
        },
        'amcharts.pie'      : {
            deps: ['amcharts'],
            exports: 'AmCharts',
            init: function() {
                AmCharts.isReady = true;
            }
        },
        'amcharts.radar'    : {
            deps: ['amcharts'],
            exports: 'AmCharts',
            init: function() {
                AmCharts.isReady = true;
            }
        },
        'amcharts.serial'   : {
            deps: ['amcharts'],
            exports: 'AmCharts',
            init: function() {
                AmCharts.isReady = true;
            }
        },
        'amcharts.xy'       : {
            deps: ['amcharts'],
            exports: 'AmCharts',
            init: function() {
                AmCharts.isReady = true;
            }
        }
    }
});

require(['jquery', 'Handlebars', 'application/bootstrap', 'router'], function ($, Handlebars, bootstrap, router) {
    var routes = {
        home: {
            path: '/',
            moduleId: 'application/dashboard'
        },
        dashboard: {
            path: '/dashboard',
            moduleId: 'application/dashboard'
        },
        customer: {
            path: '/customer',
            moduleId: 'application/customer'
        },
        calendar: {
            path: '/calendar',
            moduleId: 'application/calendar'
        },
        opportunity: {
            path: '/opportunity',
            moduleId: 'application/opportunity'
        },
        lead: {
            path: '/lead',
            moduleId: 'application/lead'
        },
        competitor: {
            path: '/competitor',
            moduleId: 'application/competitor'
        },
        report: {
            path: '/report',
            moduleId: 'application/report'
        },
        file: {
            path: '/file',
            moduleId: 'application/file'
        },
        plugin: {
            path: '/plugin',
            moduleId: 'application/plugin'
        },
        settings_personal: {
            path: '/settings/personal',
            moduleId: 'application/settings_personal'
        },
        settings_system: {
            path: '/settings/system',
            moduleId: 'application/settings_system'
        },
        customer_item: {
            path: '/customer/:id',
            moduleId: 'application/customer_item'
        },
        lead_item: {
            path: '/lead/:id',
            moduleId: 'application/lead_item'
        },
        opportunity_item: {
            path: '/opportunity/:id',
            moduleId: 'application/opportunity_item'
        },
        person_item: {
            path: '/person/:id',
            moduleId: 'application/person_item'
        },
        contract_item: {
            path: '/contract/:id',
            moduleId: 'application/contract_item'
        },
        payment_item: {
            path: '/payment/:id',
            moduleId: 'application/payment_item'
        },
        competitor_item: {
            path: '/competitor/:id',
            moduleId: 'application/competitor_item'
        },
        report_task: {
            path: '/report_task',
            moduleId: 'application/report_task'
        },
        report_funnel: {
            path: '/report_funnel',
            moduleId: 'application/report_funnel'
        },
        report_opportunity_rate: {
            path: '/report_opportunity_rate',
            moduleId: 'application/report_opportunity_rate'
        },
        report_opportunity_price: {
            path: '/report_opportunity_price',
            moduleId: 'application/report_opportunity_price'
        },
        report_payment_price: {
            path: '/report_payment_price',
            moduleId: 'application/report_payment_price'
        },
        report_payment_scale: {
            path: '/report_payment_scale',
            moduleId: 'application/report_payment_scale'
        },
        report_win: {
            path: '/report_win',
            moduleId: 'application/report_win'
        },
        report_person: {
            path: '/report_person',
            moduleId: 'application/report_person'
        },
        file_item: {
            path: '/file/:id',
            moduleId: 'application/file_item'
        },
        notFound: {
            path: '*',
            moduleId: 'application/404'
        }
    }
    router.registerRoutes(routes);

    router.routeArguments({ path: '/customer/:id' }, window.location.href);
    router.routeArguments({ path: '/lead/:id' }, window.location.href);
    router.routeArguments({ path: '/opportunity/:id' }, window.location.href);
    router.routeArguments({ path: '/person/:id' }, window.location.href);
    router.routeArguments({ path: '/contract/:id' }, window.location.href);
    router.routeArguments({ path: '/payment/:id' }, window.location.href);
    router.routeArguments({ path: '/competitor/:id' }, window.location.href);
    router.routeArguments({ path: '/file/:id' }, window.location.href);
    router.on('routeload', function (_module, routeArguments) {
        bootstrap.bootstrap_init(function () {
            airteams.controllers['bootstrap'] = bootstrap;
            _module.bootstrap_init();
        });
    }).init();
});