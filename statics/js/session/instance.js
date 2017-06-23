require.config({
    baseUrl: '/statics/js/',
    paths: {
        jquery: 'lib/jquery.min',
        Handlebars: 'lib/handlebars-v1.3.0'
    }
});

require(['jquery', 'Handlebars'], function ($, Handlebars) {
	var model = $('body').attr('id');
	if(model == 'session_new') require(['session/session_new'], function (session) {
	    session.bootstrap_rend();
	    bootstrap_submit = session.bootstrap_submit;
	}); else if (model == 'session_reset') require(['session/session_reset'], function (session) {
	    session.bootstrap_rend();
	    bootstrap_submit = session.bootstrap_submit;
	}); else if (model == 'session_resetSent') require(['session/session_resetSent'], function (session) {
	    session.bootstrap_rend();
	    bootstrap_submit = session.bootstrap_submit;
	});
});