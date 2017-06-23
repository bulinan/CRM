define(function (require, exports, module) {
    var bootstrap = require('application/bootstrap'),
        templet_settings_personal = require('lib/text!application/templet/settings_personal.html');

    exports.bootstrap_init = function () {
        exports.init();
    }
    exports.init = function () {
        bootstrap.component_window_account_remove();
        bootstrap.bootstrap_initWorkspace();
        bootstrap.bootstrap_initMain(function () {
            bootstrap.bootstrap_push('个人设置', '/settings/personal');
            $('#workspace').html(Handlebars.compile(templet_settings_personal)({ 'USER_HEAD': bootstrap.bootstrap_loadUserHead(airteams.account.USER.HEAD), 'USER_NAME': airteams.account.USER.NAME, 'USER_TITLE': airteams.account.USER.TITLE, 'USER_EMAIL': airteams.account.USER.EMAIL }));
        });
    };
    exports.error_messages_show = function (_messages) {
        $('#settings').find('ul li.success_tip').hide();
        $('#settings').find('ul li.error_tip .message').html(_messages);
        $('#settings').find('ul li.error_tip').show();
    };
    exports.head_upload = function () {
        var element = arguments[1];

        element.off().on('change', function () {
            if (element.val() == '') return;
            var head_name = element.val().replace(/.*(\/|\\)/, "");

            $('[name=API_TOKEN]').val(airteams.settings.API_TOKEN);
            element.parents('.head_upload').ajaxSubmit({
                dataType: 'json',
                beforeSubmit: function () {
                    element.html('正在上传...');
                },
                success: function (_message) {
                    if (_message.succeed) {
                        var response = _message.response;

                        element.closest('.section').find('img').attr('src', airteams.settings.API_BASE + 'file/download?API_TOKEN=' + airteams.settings.API_TOKEN + '&ID=' + response.ID);
                        $('input[name=user_head]').val(response.ID);
                        element.html('修改头像');
                    } else {
                        switch (_message.response) {
                            case 'INVALID_TOKEN':
                                top.location.href = '/signin';
                                break;
                            case 'NO_FILE_UPLOADED':
                                upload_error = '没有文件被上传';
                                break;
                            case 'COLLECTION_NOT_EXISTS':
                                upload_error = '文件夹不存在';
                                break;
                            case 'PARAMETERS_IMCOMPLETE':
                                upload_error = '参数不全';
                                break;
                            case 'INVALID_FILE_SIZE':
                                upload_error = '超过文件大小的限制';
                                break;
                        }
                        alert(upload_error);
                    }
                },
                error: function (xhr) {
                    alert('上传失败');
                }
            });
        });
    };
    exports.settings_personal_submit = function () {
        var bool = true;
        $('#settings').find('input').removeClass('error');

        if (bool && $('input[name=user_name]').val() == '') {
            bool = false;
            $('input[name=user_name]').addClass('error');
            exports.error_messages_show('姓名不能为空');
        }
        /*if (bool && $('input[name=old_password]').val() == '') {
        bool = false;
        $('input[name=old_password]').addClass('error');
        exports.error_messages_show('原密码不能为空');
        }
        if (bool && $('input[name=new_password]').val() == '') {
        bool = false;
        $('input[name=new_password]').addClass('error');
        exports.error_messages_show('新密码不能为空');
        }
        if (bool && $('input[name=new_password]').val() != $('input[name=repeat_password]').val()) {
        bool = false;
        $('input[name=repeat_password]').addClass('error');
        exports.error_messages_show(' 两次填写的密码不一致');
        }*/
        if (bool) {
            var params = {
                'HEAD': $('input[name=user_head]').val(),
                'NAME': $('input[name=user_name]').val(),
                'TITLE': $('input[name=user_title]').val(),
                'EMAIL': $('input[name=user_email]').val(),
                'OLD_PASSWORD': $('input[name=old_password]').val(),
                'NEW_PASSWORD': $('input[name=new_password]').val(),
                'NEW_PASSWORD_REPEAT': $('input[name=repeat_password]').val()
            };
            $('#settings').find('ul li.tip').hide();
            bootstrap.bootstrap_call('user/edit', params, function (_response) {
                if (_response == 'INVAILD_PASSWORD') {
                    exports.error_messages_show('原密码输入错误');
                    return;
                }
                if (_response == 'PASSWORD_NOT_REPEAT') {
                    exports.error_messages_show('两次输入的密码不一致');
                    return;
                }

                $('#settings').find('ul li.error_tip').hide();
                $('#settings').find('ul li.success_tip .message').html('修改个人资料成功');
                $('#settings').find('ul li.success_tip').show();
                $('#component_head').find('ul.function li.settings img').attr('src', airteams.settings.API_BASE + 'file/download?API_TOKEN=' + airteams.settings.API_TOKEN + '&ID=' + _response.HEAD);
                bootstrap.bootstrap_init();
            });
        }
    }
});