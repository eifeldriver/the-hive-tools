// ==UserScript==
// @name         the-hive-tools
// @namespace    http://tampermonkey.net/
// @version      0.2.1
// @description  add some little features to The Hive forum
// @author       EifelDriver
// @match        https://www.enter-the-hive.de/forum/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- settings ---
    var js_name                 = 'the-hive-tools';
    var js_version              = '0.2.3';
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

        var context_menu = {
            user : {
                open        : '<dt data-tht_menu="user" data-tht_task="open">open</dt>',
                add         : '<dt data-tht_menu="user" data-tht_task="add">addToWatchlist</dt>',
                remove      : '<dt data-tht_menu="user" data-tht_task="remove">removeFromWatchlist</dt>',
                activities  : '<dt data-tht_menu="user" data-tht_task="activities">show activities</dt>'
            }
        }

        var thtMenu = {
            user: {
                open        : thtMenu_gotoUserProfile,
                add         : thtMenu_addUserToWatchlist,
                remove      : thtMenu_removeUserFromWatchlist,
                activities  : thMenu_gotoUserActivities
            }
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

    }

    // --- stylesheets ---
    if (true) {

       var dialog_css = '' +
           '#tht-dialog { position: fixed; z-index: 99999; background: #666; color: #ccc; border: 1px solid #ccc; }' +
           '#tht-dialog .inner { } ' +
           '#tht-dialog dl { } ' +
           '#tht-dialog dt { color: #ccc; padding: 2px 5px; } ' +
           '#tht-dialog dt:hover { background: #ccc; color: #666; cursor: pointer; } ' +
           '#tht-dialog dt:active { background: #fff; color: #333; cursor: progress; } ' +
            ' ';

        var css = dialog_css +
            '#my-users-online li .tht-highlight { color: #fff !important; border: 1px solid #fff !important; padding: 2px 5px !important; display:inline-block; margin: 3px; }' +
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

    /**
     * identify the current context of the loaded page
     *
     */
    function getCurrentContext() {
        var context = '';
        switch (document.querySelector('body').id) {
            case 'tpl_wbb_boardList':
                context = 'frontpage';
                break;
            case 'tpl_wcf_team':
                context = 'all_members';
                break;
            case 'tpl_wcf_membersList':
                context = 'memberlist';
                break;
        }
        return context;
    }

    /**
     * return the kind of clicked element to identify the context
     *
     * @param e
     */
    function getClickedContext(e) {
        var context = '';
        var target  = e.target;
        if (target.className.indexOf('userLink') !== -1 || target.closest('a.userLink')) {
            context = 'user';
        }
        return context;
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

    // ================= menu ==================

    function thtMenu_gotoUserProfile(e) {
        var dialog = e.target.closest('#tht-dialog');
        if (dialog) {
            var infos = getTargetInfosFromDialog();
            location.href = infos.url;
            removeDialog();
        }
    }

    function thtMenu_addUserToWatchlist(e) {
        var dialog = e.target.closest('#tht-dialog');
        if (dialog) {
            var infos       = getTargetInfosFromDialog();
            var user_name   = infos.innerText;
            if (cfg) {
                if (cfg.friends_list.indexOf(user_name) == -1) {
                    cfg.friends_list.push(user_name);
                    saveConfig(cfg);
                }
            }
            removeDialog();
            location.href = location.href;  // force reload
        }
    }

    function thtMenu_removeUserFromWatchlist(e) {
        var dialog = e.target.closest('#tht-dialog');
        if (dialog) {
            var infos = getTargetInfosFromDialog();
            var user_name   = infos.innerText;
            if (cfg) {
                var idx = cfg.friends_list.indexOf(user_name);
                if (idx !== -1) {
                    delete cfg.friends_list[idx];
                    saveConfig(cfg);
                }
            }
            removeDialog();
            location.href = location.href;  // force reload
        }
    }

    function thMenu_gotoUserActivities(e) {
        var dialog = e.target.closest('#tht-dialog');
        if (dialog) {
            var infos = getTargetInfosFromDialog();
            location.href = infos.url + 'i/#recentActivity';
            removeDialog();
        }
    }

    // ================ dialog =================

    /**
     * create the dialog
     *
     * @param target
     * @param html
     * @param options
     */
    function openDialog(menu_type, e) {
        removeDialog();
        var context = getClickedContext(e);
        var wrapper = document.createElement('div');
        wrapper.id  = 'tht-dialog-wrapper';
        wrapper.innerHTML = '<div id="tht-dialog"><div class="inner"><dl></dl></div></div>';
        document.querySelector('body').appendChild(wrapper);
        var dialog  = document.querySelector('#tht-dialog');
        var infos   = setTargetInfosToDialog(e.target);

        switch (context) {
            case 'user':
                dialog.style.top  = e.y + 'px';
                dialog.style.left = e.x + 'px';
                addDialogOption(dialog, 'user', 'open');
                if (isUserOnWatchlist(infos.innerText)) {
                    addDialogOption(dialog, 'user', 'remove');
                } else {
                    addDialogOption(dialog, 'user', 'add');
                }
                addDialogOption(dialog, 'user', 'activities');
                break;
        }
        initDialogMenu(dialog);
        // init close behavior
        document.querySelector('body').addEventListener('click', function (e) {
            var target = e.target;
            // if the click isnt inside the dialog, then close dialog
            var dialog_click = target.closest('#tht-dialog-wrapper');
            if (!dialog_click) {
                removeDialog();
            }
        }, true)
    }

    /**
     * remove (close) the dialog
     *
     */
    function removeDialog() {
        var dialog = document.querySelector('#tht-dialog-wrapper');
        if (dialog) {
            dialog.parentNode.removeChild(dialog);
        }
    }

    /**
     * store infos about the clickt element to the dialog for later use
     */
    function setTargetInfosToDialog(target) {
        var infos   = null;
        var dialog  = document.querySelector('#tht-dialog');
        if (dialog) {
            if (target.tagName.toLowerCase() == 'font') {
                target = target.parentNode;
            }
            infos = {url: target.href, innerText: target.innerText};
            dialog.dataset.target = JSON.stringify(infos);
        }
        return infos;
    }

    /**
     * read infos about the clickt element to the dialog for later use
     */
    function getTargetInfosFromDialog() {
        var infos = null
        var dialog = document.querySelector('#tht-dialog');
        if (dialog) {
            infos = JSON.parse(dialog.dataset.target);
        }
        return infos;
    }

    function addDialogOption(dialog, menu_type, opt_name) {
        if (dialog && context_menu && context_menu.hasOwnProperty(menu_type) && typeof context_menu[menu_type] == 'object') {
            dialog.querySelector('dl').innerHTML += context_menu[menu_type][opt_name];
        }
    }

    /**
     * add callbacks to menu items
     *
     * @param dialog
     */
    function initDialogMenu(dialog) {
        if (dialog && typeof dialog == 'object') {
            var items = dialog.querySelectorAll("dt[data-tht_task]");
            items.forEach( function(item) {
                item.addEventListener('click', thtMenu[item.dataset.tht_menu][item.dataset.tht_task]);
            });
        }
    }


    // ===============  main  ==================

    /**
     * copy user online widget into sidebar
     *
     */
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
                highlightFriends('#my-users-online');
            }
        }
    }

    /**
     * add contextmenu to all user links
     * @param selector
     */
    function makeFriendsSelectable(selector) {
        var users = document.querySelectorAll(selector + ' a.userLink');
        users.forEach(
            function(item) {
                item.addEventListener('click', showUserDialog, false);
            }
        )
    }

    /**
     * open user context dialog
     *
     * @param e
     * @returns {boolean}
     */
    function showUserDialog(e) {
        // TODO: add own contextmenu
        if (e.button == 0) {    // left click
            e.preventDefault();
            e.stopPropagation();
            var elem = e.target;
            if (elem.tagName.toLowerCase() == 'font') {
                elem = elem.parentNode;
            }
            openDialog('user', e); //?- e.target, 'user', {x: e.x, y: e.y});
            return false;
        }
    }

    /**
     * check if the user is on the watchlist
     *
     * @param user_name
     * @returns {boolean}
     */
    function isUserOnWatchlist(user_name) {
        var found = false;
        if (cfg) {
            if (cfg.friends_list.indexOf(user_name) !== -1) {
                found = true;
            }
        }
        return found;
    }

    /**
     * highlight all online users what are on watchlist
     *
     * @param selector
     */
    function highlightFriends(selector) {
        var users = document.querySelectorAll(selector + ' a.userLink');
        users.forEach(
            function(item) {
                if (isUserOnWatchlist(item.innerText)) {
                    var font = item.querySelector('font');
                    if (!font) { // link without font element
                        item.style.backgroundColor = '#666666';
                        item.style.color = '#333 !important';
                        item.className = item.className.replace(' tht-highlight', '') + ' tht-highlight';
                    } else {
                        var color = font.color;
                        font.style.backgroundColor = color;
                        font.className = font.className.replace(' tht-highlight', '') + ' tht-highlight';
                    }
                }
            }
        )
    }

    function highlightFriendsOnList() {
        _debug('exec highlightFriendsOnList');
    }

    // ================= main =================

    /**
     * start the script
     *
     */
    function startScript() {
        _debug('the-hive-tools started');
        loadConfig();
        updateCss(css);
        switch (getCurrentContext()) {
            case 'frontpage':
                addPortletUsersOnline();
                break;
            case 'all_members':
                highlightFriendsOnList();
                break;
        }
    }

    startScript();

})();