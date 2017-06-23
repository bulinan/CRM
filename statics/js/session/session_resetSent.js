define(function (require) {

    var bootstrap_rend = function () {
        var language = $('#container').attr('data-language');
        $('#container').html(Handlebars.compile($('#templet_session_resetsent').html())(
            bootstrap_i18n(1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010, 1011, 1012, 1013, 8002, 9001, 9002, 9004, 9005, 9006)
        ));
        if (language == 'english') $('select').val('english');
        else if (language == 'chinese_simplified') $('select').val('chinese_simplified');
        bootstrap_push(i18n['8002'] + ' - AirTeams', '/forgot/sent');
    };
    var bootstrap_i18n = function () {
        var result = {};
        for (var index = 0; index < arguments.length; index++) result['I' + arguments[index].toString()] = eval("i18n['" + arguments[index].toString() + "']");
        return result;
    };
    var bootstrap_language = function (_el) {
        var language = $(_el).val();
        if (language == 'chinese_simplified') {
            if (!bootstrap_i18n_chinese_simplified) {
                $.getScript('/statics/js/session/i18n/language_chinese_simplified.js', function () {
                    bootstrap_i18n_chinese_simplified = i18n;
                    bootstrap_language_rend(language);
                });
            } else {
                i18n = bootstrap_i18n_chinese_simplified;
                bootstrap_language_rend(language);
            }
        } else if (language == 'english') {
            if (!bootstrap_i18n_english) {
                $.getScript('/statics/js/session/i18n/language_english.js', function () {
                    bootstrap_i18n_english = i18n;
                    bootstrap_language_rend(language);
                });
            } else {
                i18n = bootstrap_i18n_english;
                bootstrap_language_rend(language);
            }
        }
    };
    var bootstrap_language_rend = function (_language) {
        $('#container').attr('data-language', _language);
        bootstrap_rend();
    };
    var bootstrap_submit = function (_el) {
        var params = {
            'CODE': $('input[name=CODE]').val(),
            'USER_PHONE': $('input[name=USER_PHONE]').val(),
            'USER_PASSWORD': $('input[name=USER_PASSWORD]').val()
        };
        if (params.USER_PHONE == '') {
            component_error($(_el), i18n['9002']);
            return false;
        }
        if (params.CODE == '') {
            component_error($(_el), i18n['9010']);
            return false;
        }
        if (params.USER_PASSWORD == '') {
            component_error($(_el), i18n['9003']);
            return false;
        }
        $(_el).submit();
    };
    var bootstrap_i18n_chinese_simplified = null;
    var bootstrap_i18n_english = null;
    var bootstrap_push = function (_title, _pathName) {
        if (_title) document.title =  _title;
        else document.title = airteams.title;
        if (history && history.pushState) history.pushState(null, null, _pathName);
    };
    var component_error = function (_object, _message) {
        _object.find('.error').remove();
        _object.prepend('<div class="error">' + _message + '</div>');
        return false;
    };

    return {
        bootstrap_rend: bootstrap_rend,
        bootstrap_language: bootstrap_language,
        bootstrap_submit: bootstrap_submit
    };

}); 

