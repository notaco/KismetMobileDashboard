( typeof define === "function" ? function (m) { define("kmd_login", m); } :
  function(m){ this.kmd_login = m(); }
)(function () {

"use strict";

var stale_cookie = "";

var login_create = function() {
    var username = $('#username').val();
    var password = $('#password').val();

    $.ajax({
        type: "POST",
        url: kmd_rest_prefix + "session/set_password",
        data: {
            "username": username,
            "password": password
        },
        error: function(jqXHR, textStatus, errorThrown) {
            alert("Could not set login, check your kismet server logs.");
        },
    }).done(function() {
        if ($('#login-save').is(':checked')) {
            kmd.putStorage('kismet.base.login.username', username);
            kmd.putStorage('kismet.base.login.password', password);
        }
        $('#login-dialog').hide();
        kmd.startUpdates();
    });
};

var login_user = function() {
    var username = $('#username').val();
    var password = $('#password').val();

    $.ajax({
        url: kmd_rest_prefix + "session/check_login",
        beforeSend: function (xhr) {
            xhr.setRequestHeader ("Authorization", "Basic " + btoa(username + ":" + password));
        },
        xhrFields: {
            withCredentials: false
        },
        error: function(jqXHR, textStatus, errorThrown) {
            kmd.ui.alert('Login failed!');
        },
        success: function(data, textStatus, jqXHR) {
            if ($('#login-save').is(':checked')) {
                kmd.putStorage('kismet.base.login.username', username)
                kmd.putStorage('kismet.base.login.password', password)
            }
            $('#login-dialog').hide();
            kmd.startUpdates();
        }
    });
};

var login_token = function() {
    var apitoken = $('#apitoken').val();
    document.cookie="KISMET=" + apitoken + ";path=/";

    $.get(kmd_rest_prefix + "session/check_session")
    .done(function(data, textStatus, jqXHR) {
        if ($('#token-save').is(':checked'))
            kmd.putStorage('kmd.apitoken', apitoken)
        $('#token-dialog').hide();
        kmd.startUpdates();
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        kmd.ui.alert('API Token invalid!');
    });
};

var clear_saved_login = function() {
    kmd.removeStorage('kismet.base.login.username')
    kmd.removeStorage('kismet.base.login.password')
    kmd.ui.alert('Saved login cleared!');
};

var clear_saved_token = function() {
    kmd.removeStorage('kmd.apitoken')
    $('#apitoken').val('');
    kmd.ui.alert('Saved API Token cleared!');
};

var clear_cookie = function(by_click) {
    document.cookie="KISMET=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    if (by_click) {
        stale_cookie = '';
        kmd.ui.alert('Session cookie cleared!');
    }
};

var revert_cookie = function() {
    if (stale_cookie === '')
        return kmd.ui.alert('Session cookie missing!<br>Provide credentials.');
    document.cookie = stale_cookie + ";path=/";
    $.get(kmd_rest_prefix + "session/check_session")
    .done(function(data, textStatus, jqXHR) {
        $("#login-dialog").hide();
        $("#token-dialog").hide();
        kmd.startUpdates();
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        kmd.ui.alert('Session cookie invalid!');
    });
};

var create_login_dialog = function(options) {
    $('#login-content').html(
        ($('<p>', { id: 'login-header' }).html(options['header']))
        .append($('<p>')
            .html($('<ons-input>', {
                        id: 'username',
                        placeholder: 'Username',
                        modifier: 'underbar',
                        value: kmd.getStorage('kismet.base.login.username', 'kismet')
                    })))
        .append($('<p>')
            .html($('<ons-input>', {
                        id: 'password',
                        placeholder: 'Password',
                        type: 'password',
                        modifier: 'underbar',
                        value: kmd.getStorage('kismet.base.login.password', '')
                    }).keypress(function (e) {
                                        if (e.which == 13) {
                                            $('#login-button').click();
                                            return false;
                                        }
                                    })))
        .append($('<p>')
                .html($('<ons-button>', {
                        id: 'login-button',
                        class: 'show-clickable'
                      }).text(options['button'])
                      .click(options['target'])))
        .append($('<div>', {
                    class: 'card prompt-card'
                }).html(options['prompt']))
        .append($('<ons-checkbox>', {
                    'input-id': 'login-save',
                    checked: true
                }))
        .append(' Save login ')
        .append($('<a>', {
                    class: 'show-clickable'
        }).text(' (Clear saved) ')
                .click(clear_saved_login))
        .append($('<p>').html(
            $('<div>').html(
                $('<a>', {
                        class: 'show-clickable'
                }).text('Clear Session Cookie')
                .click(clear_cookie))
            .append(' | ')
            .append(
                $('<a>', {
                            class: 'show-clickable'
                        }).text('Use API Token')
                        .click(exports.showToken)))
         )
    ).prepend($("<ons-icon>", {
                icon: "fa-close",
                class: 'topright show-clickable' })
              .click(revert_cookie)
             );
    $('#login-dialog').show();
};

var create_token_dialog = function() {
    $('#token-content').html(
        ($('<p>', { id: 'token-header' }).html('Access Kismet using API Token'))
        .append($('<p>')
            .html($('<ons-input>', {
                        id: 'apitoken',
                        placeholder: 'API Token',
                        modifier: 'underbar',
                        value: kmd.getStorage('kmd.apitoken', '')
                    }).keypress(function (e) {
                                        if (e.which == 13) {
                                            $('#token-button').click();
                                            return false;
                                        }
                                    })))
        .append($('<p>')
                .html(
                    $('<ons-button>', {
                        id: 'token-button',
                        class: 'show-clickable'
                    }).text('Use Token')
                    .click(login_token)
                ))
        .append($('<div>', {
                    class: 'card prompt-card'
                }).html("API Tokens with '<code>admin</code>' or '<code>readonly</code>' roles can be used to access data. '<code>admin</code>' role will be required to modify any devices, state, or configuration. Session cookie for '<code>readonly</code>' role will conflict with Kismet web interface, session cookie can be cleared below."))
        .append($('<ons-checkbox>', {
                    'input-id': 'token-save',
                    checked: true
                }))
        .append(' Save token ')
        .append($('<a>', {
                    class: 'show-clickable'
        }).text(' (Clear saved) ')
                .click(clear_saved_token))
        .append($('<p>').html(
            $('<div>').html(
                $('<a>', {
                        class: 'show-clickable'
                }).text('Clear Session Cookie')
                .click(clear_cookie))
            .append(' | ')
            .append(
                $('<a>', {
                            class: 'show-clickable'
                        }).text('Provide Login')
                        .click(exports.showLogin)))
        )
    ).prepend($("<ons-icon>", {
                icon: "fa-close",
                class: 'topright show-clickable' })
              .click(revert_cookie)
             );
    $('#token-dialog').show();
};

var check_session_cb = function(code) {
    if (code == 200 || code == 406) {
        $.get(kmd_rest_prefix + "system/user_status.json")
            .done(function(data) {
                var system_user = kmd.sanitizeHTML(data['kismet.system.user']);
                if (code == 406)
                    create_login_dialog({
                        header: 'Kismet requires a login to access data.',
                        button: 'Login',
                        target: login_user,
                        prompt: 'Kismet has been set up with credentials in the configuration files. Kismet configuration files are usually found in <code>/etc/kismet/</code> or <code>/usr/local/etc/</code>.'
                    });
                else
                    create_login_dialog({
                        header: 'Kismet requires a login to access data.',
                        button: 'Login',
                        target: login_user,
                        prompt: 'Your login is stored in in <code>.kismet/kismet_httpd.conf</code> in the <i>home directory of the user who launched Kismet</i>;  This server is running as ' + system_user + ', and the login will be saved in <code>~' + system_user + '/.kismet/kismet_httpd.conf</code>.'
                    });
            })
            .fail(function() {
                console.log("HTTP Request for 'user_status.json' Failed");
            })
    } else {
        $.get(kmd_rest_prefix + "system/user_status.json")
            .done(function(data) {
                var system_user = kmd.sanitizeHTML(data['kismet.system.user']);
                create_login_dialog({
                    header: 'To finish setting up Kismet, you need to configure a login.',
                    button: 'Create Login',
                    target: login_create,
                    prompt: 'This login will be stored in <code>.kismet/kismet_httpd.conf</code> in the <i>home directory of the user who launched Kismet</i>;  This server is running as ' + system_user + ', and the login will be saved in <code>~' + system_user + '/.kismet/kismet_httpd.conf</code>.'
                });
            })
            .fail(function() {
                console.log("HTTP Request for 'user_status.json' Failed");
            })
    }
};

var exports = {
    checkSession: function() {
        var token = kmd.getStorage('kmd.apitoken', '');
        if ((document.cookie === '')&&(token !== ''))
            document.cookie = "KISMET=" + token + ";path=/";
        $.get(kmd_rest_prefix + "session/check_session")
        .done(function(data, textStatus, jqXHR) {
            kmd.startUpdates();
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
            exports.showLogin();
        });
    },
    showLogin: function() {
        kmd.stopUpdates();
        kmd.ui.menu.close();

        var token_dialog = document.getElementById('token-dialog');
        if (token_dialog)
            token_dialog.hide();

        if (document.cookie !== '') {
            stale_cookie = document.cookie;
            clear_cookie(false);
        }

        var dialog = document.getElementById('login-dialog');
        if ((dialog)&&($('#login-button').text() !== 'Create Login')) {
            $('#username').val(kmd.getStorage('kismet.base.login.username', 'kismet'));
            $('#password').val(kmd.getStorage('kismet.base.login.password', ''));
            dialog.show();
        } else {
            ons.createElement('login-page', { append: true })
            .then(function(dialog) {
                $.ajax({
                    url: kmd_rest_prefix + "session/check_setup_ok",
                    error: function(jqXHR, textStatus, errorThrown) {
                        check_session_cb(jqXHR.status);
                    },
                    success: function(data, textStatus, jqHXR) {
                        check_session_cb(200);
                    },
                });
            });
        }
    },
    showToken: function() {
        kmd.stopUpdates();
        kmd.ui.menu.close();

        var login_dialog = document.getElementById('login-dialog');
        if (login_dialog)
            login_dialog.hide();

        if (document.cookie !== '') {
            stale_cookie = document.cookie;
            clear_cookie(false);
        }

        var dialog = document.getElementById('token-dialog');
        if (dialog) {
            $('#apitoken').val(kmd.getStorage('kmd.apitoken', ''));
            dialog.show();
        } else {
            ons.createElement('token-page', { append: true })
            .then(function(dialog) {
                create_token_dialog();
            });
        }
    }
};

return exports;
});
