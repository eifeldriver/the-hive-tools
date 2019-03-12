// ==UserScript==
// @name         the-hive-tools
// @namespace    http://tampermonkey.net/
// @version      0.4.0
// @description  add some little features to The Hive forum
// @author       EifelDriver
// @match        https://www.enter-the-hive.de/forum/*
// @update       https://raw.githubusercontent.com/eifeldriver/the-hive-tools/master/the-hive-tools.min.js?v=0.4.0
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- settings ---
    var js_name                 = 'the-hive-tools';
    var js_version              = '0.4.0';
    var js_debug                = 1;
    var watcher1, watcher2;

    // --- config vars ---
    var cfg                     = {};

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

    // --- observer ---

    // --- HTML snippets ---

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
            '#my-users-online a.userLink { font-style: italic; padding: 2px; } ' +
            '#my-users-online a.userLink.dc-online { font-style: normal; border-bottom: 1px solid #aaa; } ' +
            '#my-users-absent li { height: 2em; } ' +
            '#my-users-absent li a {  } ' +
            '#my-users-absent li span { display: block; width: 100%; position: relative; top: -1.5em; text-align: right; } ' +
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

    /**
     * read the content of the url and then call the callback function
     * @param url
     */
    function readDataFromUrl(url, callback) {
        var success = false;
        if (window.XMLHttpRequest) {
            var xhr = new XMLHttpRequest();
            xhr.onload = callback;
            xhr.open('GET', url);
            xhr.send();
            success = true;
        }
        return success;
    }

    /**
     * store data into cache
     * @param key
     * @param data
     */
    function setDataToCache(key, data) {
        if (typeof key == 'string' && data) {
            var cache_data = {data: data, timestamp: Date.now()};
            localStorage.setItem(js_name + '_cache_' + key, JSON.stringify(cache_data));
        }
    }

    /**
     * get cached data
     * @param key
     * @param expire
     * @returns {*}
     */
    function getDataFromCache(key, expire) {
        var data = null;
        if (typeof expire != 'number') {
            expire = 60 * 60 * 24;  // 1 day
        }
        if (key && typeof key == 'string') {
            try {
                var cache_data = JSON.parse(localStorage.getItem(js_name + '_cache_' + key));
                if (cache_data === null) {
                    // throw "error : cached data isnt JSON string";
                    _debug('error : key doesnt exist in cache');
                } else {
                    if ((Date.now() - cache_data.timestamp) < expire) {
                        data = cache_data.data;
                        _debug('cached data for "' + key + '" loaded');
                    } else {
                        _debug('cached data for "' + key + '" has expired');
                    }
                }
            }
            catch (err) {
                _debug('error: cached data isnt a JSON string');
            }
        }
        return data;
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
     * collect the online users from DC widget
     *
     */
    function getDiscordUsersOnline() {
        var dc_users = document.querySelectorAll('.scDiscordWidget .widget-member-name');
        if (dc_users) {
            var cache_data = getDataFromCache('dc_users', 60);  // caching for 1 min
            if (cache_data === null) {
                var users = {};
                dc_users.forEach(function (user) {
                    var tmp = user.innerText.split('|');
                    if (tmp.length < 2) {
                        users[tmp[0].trim()] = tmp[0].trim();
                    } else {
                        users[tmp[0].trim()] = tmp[1].trim();
                    }
                });
                setDataToCache('dc_users', users);
            } else {
                // do nothing because users are still up2date
            }
        }
    }

    /**
     * check if the given user in the dc_users list (means is online)
     * @param user
     */
    function isDcUserOnline(user, dc_users) {
        if (typeof dc_users !== 'object') {
            dc_users = getDiscordUsersOnline();
        }
        var is_online = false;
        if (dc_users && typeof user == 'string') {
            is_online = dc_users.hasOwnProperty(user);
        }
        return is_online;
    }

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
        var dc_users = getDataFromCache('dc_users', 60);
        users.forEach(
            function(item) {
                item.addEventListener('click', showUserDialog, false);
                if (isDcUserOnline(item.innerText.trim(), dc_users)) {
                    item.className = item.className.replace(' dc-online', '') + ' dc-online';
                    item.title = dc_users[item.innerText.trim()];
                }
            }
        );
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

    /**
     * copy user online widget into sidebar
     *
     */
    function addPortletUsersAbsent() {
        var data = getDataFromCache('user-absent');
        if (data === null) {
            readDataFromUrl('https://www.enter-the-hive.de/forum/absent-members-list/', updateUsersAbsentPortlet);
            data = '';
        }
        // create portlet
        var html = '' +
            '<h2 class="boxTitle"><a href="https://www.enter-the-hive.de/forum/absent-members-list/">Benutzer abwesend</a></h2>' +
            '<div class="boxContent"><ol>' + data.trim() + '</ol></div>' +
            '';

        var sidebar = document.querySelector('.sidebar.boxesSidebarRight .boxContainer');
        if (sidebar) {
            var box = document.createElement('SECTION');
            box.id          = 'my-users-absent';
            box.className   = 'box';
            box.innerHTML   = html;
            // insert after "Benutzer online"
            sidebar.insertBefore(box, document.querySelector('#my-users-online').nextSibling);
        }
    }

    /**
     * process received absent list and build portlet content
     * @param data
     */
    function updateUsersAbsentPortlet(data) {
        if (data && this.status == 200) {
            // parse data
            var parser  = new DOMParser();
            var dom     = parser.parseFromString(data.currentTarget.response, 'text/html');
            var users   = [];
            var html    = '';

            // get names
            dom.querySelectorAll('ol .containerHeadline H3 a').forEach( function(item, idx) {
                users.push({name: item.innerText.trim(), url: item.href, absent: ''});
            });
            dom.querySelectorAll('.details .commaSeparated').forEach( function(item, idx) {
                var tmp = item.innerText.trim().split("\n");
                users[idx]['absent'] = tmp[2].trim().replace('abwesend bis', '');
            });
            users.forEach( function(user) {
                html += '<li><a href="' + user.url +'" title="gehe zum Benutzerprofil">' + user.name + '</a><span>' + user.absent + '</span></li>';
            });
            var list = document.querySelector('#my-users-absent .boxContent ol');
            list.innerHTML = html.trim();
            setDataToCache('user-absent', html);
        }
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
                getDiscordUsersOnline();
                addPortletUsersOnline();
                addPortletUsersAbsent();
                break;
            case 'all_members':
                break;
        }
    }

    startScript();

})();