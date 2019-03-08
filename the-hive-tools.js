// ==UserScript==
// @name         the-hive-tools
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  add some little features to The Hive forum
// @author       EifelDriver
// @match        https://www.enter-the-hive.de/forum/forum/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- settings ---
    var js_name                 = 'the-hive-tools';
    var js_version              = '0.0.1';
    var js_debug                = 1;
    var watcher1, watcher2;

    // --- config vars ---
    var cfg                     = {};
    if (true) {

        var cfg_options = {
            highlight_friends   : {type: 'bool',    label: 'Freunde hervorheben',       val: 1},
            color_friend_bg     : {type: 'color',   label: 'Freund on Hintergrund',     val: '#ffff00'},
            color_friend_fg     : {type: 'color',   label: 'Freund on Vordergrund',     val: '#333333'},
            friends_list        : {type: 'list',    label: 'Freundesliste',             val: []},
            version             : {type: 'readonly',label: 'Version',                   val: '?'}
        };

    }

    // --- observer ---
    var sidebar_mo = new MutationObserver( function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName == 'style') {
                updateQuickSearch();
            }
        });
    });

    // --- HTML snippets ---
    if (true) {
        var portlet = '' + // <section class="box">
            '<h2 class="boxTitle">Portlet</h2>' +
            '<div class="boxContent"></div>' +  // </section>
            '';
    }

    // --- stylesheets ---
    if (true) {

       var action_css = '' +
            ' ';

        var css = action_css +
            '' +
            '';
    }

    // ===============  helper  ==================

    /**
     * debug output function
     */
    function _debug(txt) {
        if (js_debug) {
            var d = new Date();
            var now = [d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()].join(':');
            console.log(now + ': ' + txt);
        }
    }


    /**
     * insert custom CSS
     *
     */
    function insertCss(css, css_id) {
        var style   = document.createElement('STYLE');
        if (css_id) {
            style.id = css_id;
        }
        style.innerHTML = css;
        document.querySelector('head').appendChild(style);
    }

    /**
     * replace old styles-element with new one
     *
     * @param css_id
     * @param css
     */
    function updateCss(css, css_id) {
        var styles = document.querySelector('#' + css_id);
        if (styles) {
            styles.parentNode.removeChild(styles);
        }
        insertCss(css, css_id);
    }

    // ============= save config ===============

    /**
     * save config to loacal storage
     *
     * @param cfg
     * @returns {boolean}
     */
    function saveConfig(data) {
        var success = false;
        if (typeof data == 'object') {
            localStorage.setItem(js_name, JSON.stringify(data));
            success = true;
            _debug('cfg saved');
        }
        return success;
    }

    /**
     * load config from local storage
     */
    function loadConfig() {
        var data;
        try {
            data = JSON.parse(localStorage.getItem(js_name));
            if (data === null) {
                throw "cfg loading error";
            }
            _debug('cfg loaded');
            for (var property in cfg_options) {
                if (!data.hasOwnProperty(property)) {
                    // set missing property with default value
                    data[property] = cfg_options[property]['val'];
                    _debug('add config option : ' + property);
                }
            }
            _debug('cfg verified');
        }
        catch(err) {
            // stored cfg incorrect -> use default values
            data = {};
            for (var property in cfg_options) {
                data[property] = cfg_options[property]['val'];
            }
            _debug('cfg loading failed - use default settings');
        }
        cfg = data;
        saveConfig(cfg);
    }

    // ===============  main  ==================

    function addPortletUsersOnline() {
        var users = document.querySelector("section.box[data-box-identifier='com.woltlab.wcf.UsersOnline']");
        if (users) {
            var sidebar = document.querySelector('.sidebar.boxesSidebarRight .boxContainer');
            if (sidebar) {
                var box = document.createElement('SECTION');
                box.id          = 'my-users-online';
                box.className   = 'box';
                box.innerHTML   = users.innerHTML;
                sidebar.prepend(box);
                makeFriendsSelectable('#my-users-online');
            }
        }
    }

    function makeFriendsSelectable(selector) {
        var users = document.querySelectorAll(selector + ' a.userLink');
        users.forEach(
            function(item) {
                item.addEventListener('click', showAddFriendDialog, false);
            }
        )
    }

    function showAddFriendDialog(e) {
        // TODO: add own contextmenu
        if (e.button == 0) {    // left click
            e.preventDefault();
            e.stopPropagation();
            var elem = e.target;
            if (elem.tagName.toLowerCase() == 'font') {
                elem = elem.parentNode;
            }
            var user_name = elem.innerText.trim();
            addFriendToWatchlist(user_name);
            return false;
        }
    }
    
    function addFriendToWatchlist(user_name) {
        if (cfg) {
            if (cfg.friends_list.indexOf(user_name) == -1) {
                cfg.friends_list.push(user_name);
                saveConfig(cfg);
            }
        }
    }

    // ---  init script ---
    function startScript() {
        _debug('the-hive-tools started');
        loadConfig();
        addPortletUsersOnline();
    }

    // --- wait for window loaded event ---
    startScript();

})();