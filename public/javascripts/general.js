classes = [];
var activity = new
function() {
    this.name = window.location.href.split("/")[window.location.href.split("/").length - 1].split(".")[0];
    this.problemnumber = 0;
    this.problemnumberinc = function() {
        return this.problemnumber++;
    };
    this.report = function() {
        //return '../reports/' + activity.name + 'Report.php';
    };
    this.collect = function() {
        //return '../collect/' + activity.name + 'Collect.php';
    };
    this.bugreport = function() {
        return [["problemnumber", this.problemnumber]];
    };
    this.Homework = function() {
        //if($.getUrlVar("hw"))
        //	return $.getUrlVar("hw");
        //else
        return false;
    };
    this.Time = function() {
        //if($.getUrlVar("Time"))
        //	return $.getUrlVars("Time");
        //else
        return 0;
    };
    this.Prob = function() {
        //if($.getUrlVar("Problems"))
        //	return $.getUrlVars("Problems");
        //else
        return 0;
    };
    this.Score = function() {
        //if($.getUrlVar("Score"))
        //	return $.getUrlVar("Score");
        //else
        return 0;
    };
    this.timer = '';
};
classes[classes.length] = activity;
function general() {
    //initSetup();
    //initBind();
    $("#reportbutton").click(function() {
        /*$("#reportbody").load(activity.report(), function() {
            if (activity.Homework()) {
                $("#dialog-report").dialog({
                    modal: true,
                    title: "Report",
                    width: "auto",
                    height: 500,
                    buttons: {
                        Print: function() {
                            $("#dialog-report").printElement({
                                pageTitle: $("title").text() + ' Report'
                            });
                        },
                        Ok: function() {
                            $(this).dialog('close');
                        },
                        'Submit Homework': function() {
                            $.post("../collect/HomeworkCollect.php", {
                                Homework: 1,
                                act: activity.name,
                                tIndex: activity.Homework()
                            });
                            //getUrlVars
                            activity.Homework = false;
                            $(this).dialog('close');
                        }
                    }
                })
            }
            else {*/
                $("#dialog-report").dialog({
                    modal: true,
                    title: "Report",
                    width: "auto",
                    height: 500,
                    buttons: {
                        Print: function() {
                            $("#dialog-report").printElement({
                                pageTitle: $("title").text() + ' Report'
                            });
                        },
                        Ok: function() {
                            $(this).dialog('close');
                        }
                    }
                })
            //}
        //});
    });
    /*$("#homework").qtip({
        content: {
            text: '<div id=hw_time>Time: ' + activity.Time() + ' Minutes</div>' + '<div id=hw_prob>Problems: ' + activity.Prob() + '</div>' + '<div id=hw_score>Score: ' + activity.Score() + ' %</div>',
            title: {
                text: 'Homework Goals',
                button: 'Close' // Show a close link in the title
            }
        },
        position: {
            corner: {
                target: 'bottomMiddle',
                // Position the tooltip above the link
                tooltip: 'topMiddle'
            },
            adjust: {
                screen: true // Keep the tooltip on-screen at all times
            }
        },
        show: {
            when: 'click',
            solo: true // Only show one tooltip at a time
        },
        hide: 'unfocus',
        style: {
            tip: true,
            // Apply a speech bubble tip to the tooltip at the designated tooltip corner
            border: {
                width: 0,
                radius: 4
            },
            name: 'light' // Use the default light style
        }
    });*/
    if (activity.Prob() <= activity.problemnumber) {
        $("#hw_prob").addClass("reportcorrect");
    }
    activity.timer = setTimeout('$("#hw_time").addClass("reportcorrect")', activity.Time() * 1000 * 60);

    $("#settingsbutton").click(function() {
        $("#dialog-settings").dialog({
            modal: true,
            title: "Settings",
            buttons: {
                Ok: function() {
                    $(this).dialog('close');
                }
            }
        });
    });
    $("#bugReport").click(function() {
        $("#bugInfo").dialog({
            modal: true,
            title: "Report Bug",
            buttons: {
                Submit: function() {
                    var bugs = [];
                    var variables = [];
                    var values = [];
                    for (i = 0; i < classes.length; i++) {
                        bugs = bugs.concat(classes[i].bugreport());
                    }
                    for (i = 0; i < bugs.length; i++) {
                        variables[i] = bugs[i][0];
                        values[i] = bugs[i][1];
                    }
                    err = $("#bugInfo").val();
                    fn = String(window.location.href);
                    SystemInfo = String(navigator.userAgent);
                    /*$("#bugInfo").load("../collect/bugTrackCollect.php", {
                        SystemInfo: SystemInfo,
                        Locationurl: fn,
                        VariablesArray: variables.join(),
                        ValuesArray: values.join(),
                        ErrorInfo: err
                    });*/
                    $(this).dialog('close');
                }
            }
        });
    });
    $("#strategy").click(function() {
        $("#strategy_textarea").dialog({
            modal: true,
            title: "What's Your Strategy?",
            buttons: {
                Submit: function() {
                    /*strategy = $("#strategy_textarea").val();
                    $.post("../collect/StrategyCollect.php", {
                        Activity: activity.name,
                        strategy: strategy
                    });*/
                    $(this).dialog('close');
                }
            }
        });
    });
    //initStart();
    /*$.post("../collect/SessionCollect.php", {
        Activity: activity.name,
        Homework: false
    });*/
    $("#main").hide().delay(500).slideDown(1000, function() {
        try {
            if (!multichoice) {
                $("#splashscreen").height($("#activityContents").height());
                $("#splashscreen img").css("max-height", $("#activityContents").height() * 0.7 + "px");
            }
        }
        catch (e) {

        }
    });

};

$.extend({
    getUrlVars: function() {
        var vars = [],
            hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for (var i = 0; i < hashes.length; i++) {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    },
    getUrlVar: function(name) {
        return $.getUrlVars()[name];
    }
});

(function($) {
    var cache = [];
    // Arguments are image paths relative to the current page.
    $.preLoadImages = function() {
        var args_len = arguments.length;
        for (var i = args_len; i--;) {
            var cacheImage = document.createElement('img');
            cacheImage.src = arguments[i];
            cache.push(cacheImage);
        }
    }
})(jQuery)

jQuery.fn.chain = function() {
    var args = jQuery.makeArray(arguments),
        name = args.shift();
    var self = jQuery(this),
        depth = 0,
        cur = this._orig || this;

    self._chain = [];
    self._orig = this;

    args.push(function() {
        for (var i = 0; i < self._chain.length; i++)
        cur = jQuery.fn[self._chain[i][0]].apply(cur, self._chain[i][1]);
    });

    for (var method in self)
    if (typeof self[method] === "function" && method !== "chain")(function(method) {
        var push = /pushStack/.test(self[method] + "");

        self[method] = function() {
            if (method === "end" && depth-- === 0) {
                if (self._orig._chain) {
                    self._orig._chain.push([name, args]);
                    return self._orig;
                } else {
                    return jQuery.fn[name].apply(self._orig, args);
                }
            }

            self._chain.push([method, arguments]);

            if (push) depth++;

            return this;
        };
    })(method);

    return self;
};

function round(num, decimals) {
    if (decimals > 0) {
        var multiplier = Math.pow(10, decimals);
    }
    else if (decimals < 0) {
        var multiplier = Math.pow(10, -1 * decimals);
    }
    if (typeof(num) != "number") {
        return null;
    }
    if (typeof(decimals) != "number") {
        var decimals = 0;
    }
    if (decimals > 0) {
        return Math.round(num * multiplier) / multiplier;
    } else if (decimals == 0) {
        return Math.round(num);
    } else if (decimals < 0) {
        return Math.round(num / multiplier) * multiplier;
    }
    else {
        return num;
    }
};

(function($) {
    var a = $.ui.mouse.prototype._mouseMove;
    $.ui.mouse.prototype._mouseMove = function(b) {
        b.button = 1;
        a.apply(this, [b]);
    }
}(jQuery));

/**
 * jQuery Cookie plugin
 *
 * Copyright (c) 2010 Klaus Hartl (stilbuero.de)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 */

// TODO JsDoc

/**
 * Create a cookie with the given key and value and other optional parameters.
 *
 * @example $.cookie('the_cookie', 'the_value');
 * @desc Set the value of a cookie.
 * @example $.cookie('the_cookie', 'the_value', { expires: 7, path: '/', domain: 'jquery.com', secure: true });
 * @desc Create a cookie with all available options.
 * @example $.cookie('the_cookie', 'the_value');
 * @desc Create a session cookie.
 * @example $.cookie('the_cookie', null);
 * @desc Delete a cookie by passing null as value. Keep in mind that you have to use the same path and domain
 *       used when the cookie was set.
 *
 * @param String key The key of the cookie.
 * @param String value The value of the cookie.
 * @param Object options An object literal containing key/value pairs to provide optional cookie attributes.
 * @option Number|Date expires Either an integer specifying the expiration date from now on in days or a Date object.
 *                             If a negative value is specified (e.g. a date in the past), the cookie will be deleted.
 *                             If set to null or omitted, the cookie will be a session cookie and will not be retained
 *                             when the the browser exits.
 * @option String path The value of the path atribute of the cookie (default: path of page that created the cookie).
 * @option String domain The value of the domain attribute of the cookie (default: domain of page that created the cookie).
 * @option Boolean secure If true, the secure attribute of the cookie will be set and the cookie transmission will
 *                        require a secure protocol (like HTTPS).
 * @type undefined
 *
 * @name $.cookie
 * @cat Plugins/Cookie
 * @author Klaus Hartl/klaus.hartl@stilbuero.de
 */

/**
 * Get the value of a cookie with the given key.
 *
 * @example $.cookie('the_cookie');
 * @desc Get the value of a cookie.
 *
 * @param String key The key of the cookie.
 * @return The value of the cookie.
 * @type String
 *
 * @name $.cookie
 * @cat Plugins/Cookie
 * @author Klaus Hartl/klaus.hartl@stilbuero.de
 */
jQuery.cookie = function (key, value, options) {
    
    // key and at least value given, set cookie...
    if (arguments.length > 1 && String(value) !== "[object Object]") {
        options = jQuery.extend({}, options);

        if (value === null || value === undefined) {
            options.expires = -1;
        }

        if (typeof options.expires === 'number') {
            var days = options.expires, t = options.expires = new Date();
            t.setDate(t.getDate() + days);
        }
        
        value = String(value);
        
        return (document.cookie = [
            encodeURIComponent(key), '=',
            options.raw ? value : encodeURIComponent(value),
            options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
            options.path ? '; path=' + options.path : '',
            options.domain ? '; domain=' + options.domain : '',
            options.secure ? '; secure' : ''
        ].join(''));
    }

    // key and possibly options given, get cookie...
    options = value || {};
    var result, decode = options.raw ? function (s) { return s; } : decodeURIComponent;
    return (result = new RegExp('(?:^|; )' + encodeURIComponent(key) + '=([^;]*)').exec(document.cookie)) ? decode(result[1]) : null;
};