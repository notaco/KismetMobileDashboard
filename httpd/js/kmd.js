( typeof define === "function" ? function (m) { define("kmd", m); } :
  function(m){ this.kmd = m(); }
)(function () {

"use strict";
var exports = {};

// basic ui functions
exports.ui = {
    go_home: function() {
        exports.ui.menu.close();
        var cnt = kmd.ui.navi.pages.length - 1;
        if (cnt > 0)
            exports.ui.navi.popPage({ animation: 'none', times: cnt });
    },
    push_page: function(page, data_obj) {
        if (typeof data_obj !== 'object')
            data_obj = {};
        exports.ui.menu.close();
        if (! page.includes(exports.ui.navi.topPage.id))
            exports.ui.navi.bringPageTop(page, { animation: 'none', data: data_obj });
    },
    alert: function(message) {
        ons.notification.toast(message, { timeout: 1000, animation: 'fall' })
    },
    show_spinner: function(message) {
        if (typeof message === 'string')
            $('#spinner-msg').text(message);
        $('#modal-loading').show();
    },
    hide_spinner: function() {
        $('#spinner-msg').text('Loading...');
        $('#modal-loading').hide();
    },
    show_dialog: function(message) {
        var dialog = document.getElementById('general-dialog');
        if (dialog) {
            $('#general-content').text(message);
            dialog.show();
        } else {
            ons.createElement('dialog-page', { append: true })
            .then(function(dialog) {
                $('#dialog-content').html(message);
                dialog.show();
            });
        }
    },
    hide_dialog: function() {
        $('#general-dialog').hide();
    },
    devices_list: function(type) {
        exports.ui.push_page('views/devices_list.html', { type: type })
    }
};

// local storage handlers (based on kismet web ui (/js/kismet.utils.js))
var storage = Storages.localStorage;
exports.getStorage = function(key, def) {
    if (storage.isSet(key))
        return storage.get(key);

    return def;
};

exports.putStorage = function(key, data) {
    storage.set(key, data);
};

exports.removeStorage = function(key) {
    if (storage.isSet(key))
        storage.remove(key);
};

// structure for controlling ajax updates based on current view
exports.timers = { home: {} };
exports.paused = false;

exports.startUpdates = function() {
    exports.paused = false;
    var page_id = exports.ui.navi.topPage.id;
    if (page_id !== '') {
        for (var ajax in exports.timers[page_id])
            exports.timers[page_id][ajax].fn();
    }
};

exports.stopUpdates = function() {
    exports.paused = true;
};

exports.pauseResume = function() {
    var p_button = $('#' + exports.ui.navi.topPage.id + ' > #button-pause');
    if (exports.paused === false) {
        p_button.html($('<ons-icon>', { icon: "md-play" }));
        exports.stopUpdates();
    } else if (exports.paused === true) {
        p_button.html($('<ons-icon>', { icon: "md-pause" }));
        exports.startUpdates();
    } else
        exports.ui.alert('Error: unexpected state: ' + exports.paused);
};

exports.pageChanged = function() {
    var p_button = $('#' + exports.ui.navi.topPage.id + ' > #button-pause');
    if (exports.paused === false) {
        p_button.html($('<ons-icon>', { icon: "md-pause" }));
        kmd.startUpdates();
    } else
        p_button.html($('<ons-icon>', { icon: "md-play" }));
};


// Visibility event handler code adaption from kismet web ui (index.html)

// Visibility detection from https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
// Set the name of the hidden property and the change event for visibility
var hidden, visibilityChange; 
if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support 
      hidden = "hidden";
      visibilityChange = "visibilitychange";
} else if (typeof document.msHidden !== "undefined") {
      hidden = "msHidden";
      visibilityChange = "msvisibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {
      hidden = "webkitHidden";
      visibilityChange = "webkitvisibilitychange";
}

var handleVisibilityChange = function() {
    if (document[hidden])
        exports.stopUpdates();
    else
        exports.startUpdates();
}

// Warn if the browser doesn't support addEventListener or the Page Visibility API
if (typeof document.addEventListener === "undefined" || hidden === undefined) {
    ; // Do nothing
} else {
    // Handle page visibility change   
    document.addEventListener(visibilityChange, handleVisibilityChange, false);
}

// function to sanitize strings for html use, from kismet web ui (js/kismet.utils.js)

exports.sanitizeHTML = function(s) {
    var remap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '`': '&#x60;',
        '=': '&#x3D;',
        '/': '&#x2F;'
    };

    return String(s).replace(/[&<>"'`=\/]/g, function (s) {
            return remap[s];
    });
}


return exports;
});
