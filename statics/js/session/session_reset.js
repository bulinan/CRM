define(function (require,exports, module) {

    exports.bootstrap_submit = function (_el) {
        var params = {
            'ACCOUNT_ID': $('input[name=ACCOUNT_ID]').val(),
            'USER_PHONE': $('input[name=USER_PHONE]').val()
        };
        if (params.ACCOUNT_ID == '') {
            component_error($(_el), '请输入您的企业帐号');
            return false;
        }
        if (params.USER_PHONE == '') {
            component_error($(_el), '请输入您的手机号码');
            return false;
        }
    };
    var component_error = function (_object, _message) {
        _object.find('.error').remove();
        _object.prepend('<div class="error">' + _message + '</div>');
        return false;
    };
}); 

