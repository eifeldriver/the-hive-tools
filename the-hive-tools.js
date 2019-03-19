// ==UserScript==
// @name         the-hive-tools
// @namespace    http://tampermonkey.net/
// @version      0.6.1
// @description  add some little features to The Hive forum
// @author       EifelDriver
// @match        https://www.enter-the-hive.de/forum/*
// @update       https://raw.githubusercontent.com/eifeldriver/the-hive-tools/master/the-hive-tools.min.js?v=0.6.1
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- settings ---
    var js_name                 = 'the-hive-tools';
    var js_version              = '0.6.1';
    var js_debug                = 1;
    var watcher1, watcher2;

    // --- config vars ---
    var cfg                     = {};

    var cfg_options = {
        user_online             : {type: 'bool',    label: 'Benutzer online',           val: '1'},
        highlight_friends       : {type: 'bool',    label: 'Freunde hervorheben',       val: '1'},
        friends_list            : {type: 'list',    label: 'Freundesliste',             val: []},
        custom_absent           : {type: 'bool',    label: 'Custom-Abwesenheit',        val: '1'},
        no_gallery_bubbles      : {type: 'bool',    label: 'keine Galerie-Bubbles.',    val: '1'},
        bubbles_color           : {type: 'color',   label: 'Bubble-Farbe',              val: '#ff0000'},
        game_service_destiny    : {type: 'bool',    label: 'Game-Service: Destiny',     val: '0'},
        game_service_division   : {type: 'bool',    label: 'Game-Service: Division',    val: '0'},
        game_service_anthem     : {type: 'bool',    label: 'Game-Service: Anthem',      val: '0'},
        version                 : {type: 'readonly',label: 'Version',                   val: js_version},
        help                    : {type: 'help',    label: 'Hilfe',                     val: '?',  url: 'https://github.com/eifeldriver/the-hive-tools/blob/master/README.md'},
        save                    : {type: 'save',    label: '&nbsp;',                    val: 'speichern'}
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

    var status_icons = {
        good    : {img: 'https://ubistatic-a.akamaihd.net/0115/tctd2/images/online.png',        title: 'Online'},
        failed  : {img: 'https://ubistatic-a.akamaihd.net/0115/tctd2/images/interrupted.png',   title: 'Offline'},
        bad     : {img: 'https://ubistatic-a.akamaihd.net/0115/tctd2/images/degradation.png',   title: '???'},
        repair  : {img: 'https://ubistatic-a.akamaihd.net/0115/tctd2/images/maintenance.png',   title: 'Wartung'}
    };

    // --- observer ---

    // --- HTML snippets ---

    var server_status_bar = {
        game_service_division:  '<div class="game-status" id="game-status-division"><span>Division 2<i><!-- --></i></span><img src="#"></div>',
        game_service_destiny:   '<div class="game-status" id="game-status-destiny"><span>Destiny 2<i><!-- --></i></span><img src="#"></div>',
        game_service_anthem:    '<div class="game-status" id="game-status-anthem"><span>Anthem<i><!-- --></i></span><img src="#"></div>'
    };

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

        var cfg_css = '' +
            '#tht-cfg-section { display: flex; flex-direction: row; padding-top: 2em; font-size: 14px; font-weight: 400; } ' +
            '#tht-cfg-section .cfg-column { width: calc(100%/3); } ' +
            '#tht-cfg-section .cfg-column label { display: inline-block; width: 65%; } ' +
            '#tht-cfg-section input.color { width: 24px; } ' +
            '#tht-cfg-section label.opt-save { width: 0px; } ' +
            '#tht-cfg-section .field-save { width: 100%; } ' +
            '';

        var server_css = '' +
            '#tht-game-status-bar { position: absolute; right: 315px; } ' +
            '#tht-game-status-bar .game-status { display: inline-block; } ' +
            '#tht-game-status-bar .game-status:hover { cursor: help; } ' +
            '#tht-game-status-bar .game-status span { position: relative; display: inline-block; margin: 0 10px 0 25px; } ' +
            '#tht-game-status-bar .game-status span i { display: inline-block; background: green; height: 2px; width: 100%; margin: 0; position: absolute; left: 0; bottom: -5px; } ' +
            '#tht-game-status-bar .game-status img { display: inline-block; width: 24px; height: 24px; } ' +
            '';

        var css = dialog_css + cfg_css + server_css +
            '#my-users-online li .tht-highlight { color: #fff !important; padding: 2px 5px !important; display:inline-block; margin: 3px; }' +
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
     *
     * @param txt the text to put into console
     */
    function _debug(txt) {
        if (js_debug) {
            var d = new Date();
            var now = [d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()].join(':');
            console.log(now + ': ' + txt);
        }
    }

    /**
     * parse given JSON string
     *
     * @param json the JSON encoded string
     * @return {*} the parsed object or null/empty if not valid
     */
    function getJsonData(json) {
        var data = null;
        try {
            data = JSON.parse(json);
        }
        catch(err) {
            // stored cfg incorrect -> use default values
            data = {};
        }
        return data;
    }

    /**
     * insert custom CSS
     *
     * @param css the stylesheets
     * @param css_id the CSS-id of the <style>-tag
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
     * @param css the stylesheets
     * @param css_id the CSS-id of the <style>-tag
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
     * The CSS-id of the <body>-tag will be used to identify the context.
     * @return the context as string
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
     * return the kind of clicked element
     *
     * The kind of clicked element means the context of the link. (i.e. 'user' = link to a forum user)
     * @param e event
     * @return the context as string
     */
    function getClickedElementType(e) {
        var context = '';
        var target  = e.target;
        if (target.className.indexOf('userLink') !== -1 || target.closest('a.userLink')) {
            context = 'user';
        }
        return context;
    }

    /**
     * open a new tab and set the focus
     * @param url
     */
    function openNewTab(url) {
        var win = window.open(url, '_blank');
        win.focus();
    }

    /**
     * read the content of the url
     *
     * @param url the target URL for the request
     * @param callback the callback function for the request
     * @return is true if the Ajax request has been started
     */
    function Ajax(url, callback) {
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
     *
     * @param key the cache key that allow later access to the stored data
     * @param data the data that have to store into cache
     * @return is true if the data has been stored into cache
     */
    function setDataToCache(key, data) {
        var success = false;
        if (typeof key == 'string' && data) {
            var cache_data = {data: data, timestamp: Date.now()};
            localStorage.setItem(js_name + '_cache_' + key, JSON.stringify(cache_data));
            success = true;
        }
        return success;
    }

    /**
     * get cached data
     *
     * @param key the cache key to access the stored data
     * @param expire the amount of seconds after that the stored data has expired
     * @return is null if any error occurs, else the stored data from cache
     */
    function getDataFromCache(key, expire) {
        var data = null;
        if (typeof expire != 'number') {
            expire = 60 * 60 * 24;  // 1 day
        }
        if (typeof key == 'string') {
            try {
                var cache_data = JSON.parse(localStorage.getItem(js_name + '_cache_' + key));
                if (cache_data === null) {
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
     * @param data the configuration as object
     * @return true if the config has heen saved
     */
    function saveConfig(data) {
        var success = false;
        if (typeof data == 'object') {
            localStorage.setItem(js_name, JSON.stringify(data));
            success = true;
            _debug('cfg saved');
            // update custom CSS
            var css = '' +
                '#pageContainer .badge.badgeUpdate, #pageContainer a.badge.badgeUpdate { background-color: ' + data.bubbles_color + '; } ' +
                '';
            updateCss(css, 'tht-custom-css');
        }
        return success;
    }

    /**
     * load config from local storage
     *
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

    /**
     * save instant the config value after element has changed
     * @param e
     */
    function instantSaveCfgOption(e) {
        var val;
        var elem = e.target;
        if (elem) {
            var opt_key = elem.id.replace('cfg-', '');
            switch (elem.dataset.cfg_type) {
                case 'bool':
                    if (elem.checked) {
                        val = 1;
                    } else {
                        val = 0;
                    }
                    cfg[opt_key] = val;
                    break;

                case 'color':
                    cfg[opt_key] = elem.value;
                    break;

                case 'text':
                    cfg[opt_key] = elem.value;
                    break;
            }
            saveConfig(cfg);
        }
    }

    // ================= menu ==================
    /* The thtMenu_-functions are handles for the context menu items.
    */

    /**
     * goto the user profile page of the clicked user
     *
     * @param e event
     */
    function thtMenu_gotoUserProfile(e) {
        var dialog = e.target.closest('#tht-dialog');
        if (dialog) {
            var infos = getTargetInfosFromDialog();
            removeDialog();
            location.href = infos.url;
        }
    }

    /**
     * add the clicked username to the watchlist
     *
     * @param e event
     */
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

    /**
     * remove the clicked username from watchlist
     *
     * @param e event
     */
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

    /**
     * goto the activities page of the clicked user
     *
     * @param e event
     */
    function thMenu_gotoUserActivities(e) {
        var dialog = e.target.closest('#tht-dialog');
        if (dialog) {
            var infos = getTargetInfosFromDialog();
            location.href = infos.url + 'i/#recentActivity';
            removeDialog();
        }
    }

    // ================ cfg dialog =================

    function insertCfgDialog() {
        var menu_sec = document.querySelector('.interactiveDropdownUserMenu .interactiveDropdownItemsContainer ul li'); // 1st li element
        if (menu_sec) {
            var cfg_sec = document.createElement('LI');
            cfg_sec.id  = 'tht-cfg-section';
            var sec1 = document.createElement('DIV');
            sec1.id  = 'cfg-col-1';
            sec1.className = 'cfg-column';
            var sec2 = document.createElement('DIV');
            sec2.id  = 'cfg-col-2';
            sec2.className = 'cfg-column';
            var sec3 = document.createElement('DIV');
            sec3.id  = 'cfg-col-3';
            sec3.className = 'cfg-column';
            cfg_sec.append(sec1);
            cfg_sec.append(sec2);
            cfg_sec.append(sec3);
            menu_sec.parentNode.prepend(cfg_sec);
            buildCfgOptions();
            updateCfgSections();
        }
    }

    /**
     * create a option field
     * @param property
     * @param container
     */
    function createCfgOption(property, container) {
        if (container) {
            if (cfg_options.hasOwnProperty(property)) {
                var lbl         = document.createElement('LABEL');
                var elem        = document.createElement('INPUT');
                lbl.htmlFor     = property;
                lbl.innerHTML   = cfg_options[property]['label'];
                lbl.className   = 'opt-' + property;
                elem.id         = 'cfg-' + property;
                switch (cfg_options[property]['type']) {
                    case 'bool':
                        elem.type = 'checkbox';
                        elem.className = 'bool';
                        elem.dataset.cfg_type = 'bool';
                        break;
                    case 'color':
                        elem.type = 'color';
                        elem.className = 'color';
                        elem.dataset.cfg_type = 'color';
                        break;
                    case 'text':
                        elem.type = 'text';
                        elem.className = 'text';
                        elem.dataset.cfg_type = 'text';
                        break;
                    case 'readonly':
                        elem = document.createElement('SPAN');
                        elem.className = 'field-readonly';
                        elem.innerText = js_version;
                        break;
                    case 'help':
                        elem = document.createElement('BUTTON');
                        elem.className = 'field-help';
                        elem.innerText = cfg_options[property]['val'];
                        elem.addEventListener('click', function() { openNewTab(cfg_options[property]['url']); } );
                        break;
                    case 'save':
                        elem = document.createElement('BUTTON');
                        elem.className = 'field-save';
                        elem.innerText = cfg_options[property]['val'];
                        elem.addEventListener('click', function() { location.href = location.href; /* simple reload because all options will be saved instantly */ } );
                        break;
                }
                elem.addEventListener('change', instantSaveCfgOption);
                var row = document.createElement('DIV');
                row.className = 'opt-row';
                row.appendChild(lbl);
                row.appendChild(elem);
                container.appendChild(row);
            }
        }
    }

    /**
     * update all config options with stored values
     */
    function updateCfgSections() {
        var cfg_sec = document.querySelector('#tht-cfg-section');
        if (cfg_sec) {
            for (var property in cfg_options) {
                var opt = document.querySelector('#cfg-' + property);
                if (opt) {
                    switch (opt.dataset.cfg_type) {
                        case 'bool':
                            if (cfg[property]) {
                                opt.checked = 'checked';
                            } else {
                                opt.checked = '';
                            }
                            break;
                        case 'color':
                            if (cfg[property]) {
                                opt.value = cfg[property];
                            } else {
                                opt.value = '';
                            }
                            break;
                        case 'text':
                            break;
                    }
                }
            }
        }
    }

    /**
     * build all config options in separte sections
     */
    function buildCfgOptions() {
        var sec;
        var cfg_sec = document.querySelector('#tht-cfg-section');
        if (cfg_sec) {
            sec = document.querySelector('#tht-cfg-section #cfg-col-1');
            if (sec) {
                createCfgOption('user_online', sec);
                createCfgOption('highlight_friends', sec);
                createCfgOption('custom_absent', sec);
                createCfgOption('no_gallery_bubbles', sec);
            }
            sec = document.querySelector('#tht-cfg-section #cfg-col-2');
            if (sec) {
                createCfgOption('bubbles_color', sec);
                createCfgOption('game_service_division', sec);
                createCfgOption('game_service_destiny', sec);
                createCfgOption('game_service_anthem', sec);
            }
            sec = document.querySelector('#tht-cfg-section #cfg-col-3');
            if (sec) {
                createCfgOption('version', sec);
                createCfgOption('help', sec);
                createCfgOption('save', sec);
            }
        }
    }

    // ================ context menu =================

    /**
     * create the context menu (dialog) to supply actions
     *
     * @param menu_type define the type of the context menu
     * @param e event
     */
    function openDialog(menu_type, e) {
        removeDialog();
        var wrapper = document.createElement('div');
        wrapper.id  = 'tht-dialog-wrapper';
        wrapper.innerHTML = '<div id="tht-dialog"><div class="inner"><dl></dl></div></div>';
        document.querySelector('body').appendChild(wrapper);
        var dialog  = document.querySelector('#tht-dialog');
        var infos   = setTargetInfosToDialog(e.target);

        switch (menu_type) {
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
     * remove the context menu (dialog)
     *
     */
    function removeDialog() {
        var dialog = document.querySelector('#tht-dialog-wrapper');
        if (dialog) {
            dialog.parentNode.removeChild(dialog);
        }
    }

    /**
     * set infos about the clicked element to the dialog element for later use
     *
     * @param target the clicked element
     */
    function setTargetInfosToDialog(target) {
        var infos   = null;
        var dialog  = document.querySelector('#tht-dialog');
        if (dialog && target) {
            if (target.tagName.toLowerCase() !== 'a') {
                target = target.closest('a.userLink');
            }
            infos = {url: target.href, innerText: target.innerText};
            dialog.dataset.target = JSON.stringify(infos);
        }
        return infos;
    }

    /**
     * get infos about the latest clicked element to the dialog element
     *
     * @return is null if no data found
     */
    function getTargetInfosFromDialog() {
        var infos = null
        var dialog = document.querySelector('#tht-dialog');
        if (dialog) {
            infos = JSON.parse(dialog.dataset.target);
        }
        return infos;
    }

    /**
     * insert a new context menu item with specific action
     *
     * see also: context_menu definition
     *
     * @param dialog reference to the dialog element
     * @param menu_type the type of the menu for the new action
     * @param opt_name the identifer for the new action
     */
    function addDialogOption(dialog, menu_type, opt_name) {
        if (dialog && context_menu && context_menu.hasOwnProperty(menu_type) && typeof context_menu[menu_type] == 'object') {
            dialog.querySelector('dl').innerHTML += context_menu[menu_type][opt_name];
        }
    }

    /**
     * add callbacks to menu items
     *
     * Any menu action element has the data-tht_task attribut, that contain the related action.
     * The function handles for the existing actions are defined in ´thtMenu` variable.
     *
     * @param dialog
     */
    function initDialogMenu(dialog) {
        if (typeof dialog == 'object') {
            var items = dialog.querySelectorAll("dt[data-tht_task]");
            items.forEach( function(item) {
                item.addEventListener('click', thtMenu[item.dataset.tht_menu][item.dataset.tht_task]);
            });
        }
    }

    // =========  game server stati ============

    /**
     * refresh time bar width to show the refresh cycle period
     *
     * @param game will be used to select the correct game refresh bar
     */
    function updateTimerBar(game) {
        var refresh_timer = document.querySelector('#game-status-' + game + ' span > i');
        if (refresh_timer) {
            var percent = parseInt(refresh_timer.style.width);
            if (percent < 2) {
                refresh_timer.style.width = '100%';
            } else {
                refresh_timer.style.width = (percent - 1) + '%';
            }
        }
    }

    /**
     * process the status response for Division
     */
    function updateGameStatus_Division() {
        var refresh_seconds = 120;
        var server_status   = getDataFromCache('game-status-division', refresh_seconds);
        if (server_status === null) {
            Ajax('https://game-status-api.ubisoft.com/v1/instances?appIds=6c6b8cd7-d901-4cd5-8279-07ba92088f06,6f220906-8a24-4b6a-a356-db5498501572,7d9bbf16-d76d-43e1-9e82-1e64b4dd5543',
                function (data) {
                    if (data && this.status == 200) {
                        var data = getJsonData(data.currentTarget.response);
                        if (typeof data == 'object' && data.hasOwnProperty('0')) {
                            switch (data[0].Status.toLowerCase()) {
                                case 'online'       : server_status = 'good'; break;
                                case 'offline'      : server_status = 'failed'; break;
                                case 'maintenance'  : server_status = 'repair'; break;
                                default             : server_status = 'bad'; break;
                            }
                            setDataToCache('game-status-division', server_status);
                            var img = document.querySelector('#game-status-division img');
                            if (img) {
                                img.src     = status_icons[server_status].img;
                                img.title   = status_icons[server_status].title;
                            }
                            var refresh_timer = document.querySelector('#game-status-division span > i');
                            refresh_timer.style.width = '100%';
                            window.setInterval(function() { updateTimerBar('division'); }, (refresh_seconds * 1000) / 100);
                        }
                    }
                }
            );

        } else {
            var img = document.querySelector('#game-status-division img');
            if (img && typeof server_status == 'string') {
                img.src     = status_icons[server_status].img;
                img.title   = status_icons[server_status].title;
            }
        }
    }

    /**
     * process the status response for Destiny
     */
    function updateGameStatus_Destiny() {
        var server_status = getDataFromCache('game-status-destiny', 60);
        if (server_status === null) {
            server_status = status_icons.bad;
            setDataToCache('game-status-destiny', server_status);
            var img = document.querySelector('#game-status-destiny img');
            if (img) {
                img.src     = status_icons['bad'].img;
                img.title   = 'noch nicht fertig';  // status_icons['bad'].title;
            }
            var refresh_timer = document.querySelector('#game-status-destiny span > i');
            refresh_timer.style.width = '0%';
        }
    }

    /**
     * process the status response for Anthem
     */
    function updateGameStatus_Anthem() {
        var server_status = getDataFromCache('game-status-anthem', 60);
        if (server_status === null) {
            // https://www.ea.com/games/anthem/live-status?isLocalized=true
            server_status = status_icons.bad;
            setDataToCache('game-status-anthem', server_status);
            var img = document.querySelector('#game-status-anthem img');
            if (img) {
                img.src     = status_icons['bad'].img;
                img.title   = 'noch nicht fertig';  // status_icons['bad'].title;
            }
            var refresh_timer = document.querySelector('#game-status-anthem span > i');
            refresh_timer.style.width = '0%';
        }
    }

    // ===============  main  ==================

    /**
     * insert the game service status monitor
     */
    function addServerStatusBar() {
        // insert status bar boilerplate code
        var nav_bar = document.querySelector('.pageNavigation .layoutBoundary');
        if (nav_bar) {
            nav_bar.style.position = 'relative';
            var status_bar = document.createElement('DIV');
            status_bar.id = 'tht-game-status-bar';
            if (cfg.game_service_division)  { status_bar.innerHTML += server_status_bar.game_service_division; }
            if (cfg.game_service_destiny)   { status_bar.innerHTML += server_status_bar.game_service_destiny; }
            if (cfg.game_service_anthem)    { status_bar.innerHTML += server_status_bar.game_service_anthem; }
            nav_bar.appendChild(status_bar);
            if (cfg.game_service_division) {
                updateGameStatus_Division();
                window.setInterval(updateGameStatus_Division, 60000);  // 1 min
            }
            if (cfg.game_service_destiny) {
                updateGameStatus_Destiny();
                window.setInterval(updateGameStatus_Destiny, 60000);  // 1 min
            }
            if (cfg.game_service_anthem) {
                updateGameStatus_Anthem();
                window.setInterval(updateGameStatus_Anthem, 60000);  // 1 min
            }
        }
    }

    /**
     * collect the online users from DC widget
     *
     */
    function getDiscordUsersOnline() {
        var dc_users = document.querySelectorAll('.scDiscordWidget .widget-member');
        if (dc_users) {
            var cache_data = getDataFromCache('dc_users', 60);  // caching for 1 min
            if (cache_data === null) {
                var users = {};
                dc_users.forEach(function (user) {
                    var user_avatar, user_nick, user_name, user_game, dc_name;
                    dc_name     = user.querySelector('.widget-member-name').innerText;
                    user_avatar = user.querySelector('.widget-member-avatar img').src;
                    user_game   = user.querySelector('.widget-member-game');
                    if (user_game) {
                        user_game = user_game.innerText.trim();
                    } else {
                        user_game = '';
                    }
                    if (dc_name.indexOf('|') !== -1) {
                        user_nick = dc_name.split('|').shift().trim();
                        user_name = dc_name.split('|').pop().trim();
                    } else {
                        user_nick = user_name = dc_name.trim();
                    }
                    users[user_nick] = {nick: user_nick, name: user_name, avatar: user_avatar, game: user_game};
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
     * copy user online widget from bottom into sidebar
     *
     */
    function addPortletUsersOnline() {
        if (cfg.user_online) {
            var users = document.querySelector("section.box[data-box-identifier='com.woltlab.wcf.UsersOnline']");
            if (users) {
                var sidebar = document.querySelector('.sidebar.boxesSidebarRight .boxContainer');
                if (sidebar) {
                    var box = document.createElement('SECTION');
                    box.id = 'my-users-online';
                    box.className = 'box';
                    box.innerHTML = users.innerHTML;
                    sidebar.prepend(box);
                    makeFriendsSelectable('#my-users-online');
                    highlightFriends('#my-users-online');
                }
            }
        }
    }

    /**
     * add contextmenu to all user links
     * @param selector
     */
    function makeFriendsSelectable(selector) {
        if (cfg.highlight_friends) {
            var users = document.querySelectorAll(selector + ' a.userLink');
            var dc_users = getDataFromCache('dc_users', 60);
            users.forEach(
                function (item) {
                    item.addEventListener('click', showUserDialog, false);
                    if (isDcUserOnline(item.innerText.trim(), dc_users)) {
                        item.className = item.className.replace(' dc-online', '') + ' dc-online';
                        var user_info = dc_users[item.innerText.trim()];
                        item.title = user_info.name + (user_info.game ? ' [' + user_info.game + ']' : '');
                    }
                }
            );
        }
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
        if (cfg.highlight_friends) {
            var users = document.querySelectorAll(selector + ' a.userLink');
            users.forEach(
                function (item) {
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
    }

    /**
     * copy user online widget into sidebar
     *
     */
    function addPortletUsersAbsent() {
        if (cfg.custom_absent) {
            var data = getDataFromCache('user-absent');
            if (data === null) {
                Ajax('https://www.enter-the-hive.de/forum/absent-members-list/', updateUsersAbsentPortlet);
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
                box.id = 'my-users-absent';
                box.className = 'box';
                box.innerHTML = html;
                // insert after "Benutzer online"
                sidebar.insertBefore(box, document.querySelector('#my-users-online').nextSibling);
            }
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
                users[idx]['absent'] = tmp[2].trim().replace('abwesend bis', '').split(',').shift();
            });
            users.forEach( function(user) {
                html += '<li><a href="' + user.url +'" title="gehe zum Benutzerprofil">' + user.name + '</a><span>' + user.absent + '</span></li>';
            });
            var list = document.querySelector('#my-users-absent .boxContent ol');
            list.innerHTML = html.trim();
            setDataToCache('user-absent', html);
        }
    }

    function hideGalleryNotifications() {
        if (cfg.no_gallery_bubbles) {
            var bubbles = document.querySelectorAll(".boxMenu li[data-identifier='com.woltlab.gallery.Gallery'] .badgeUpdate");
            if (bubbles.length) {
                bubbles.forEach(
                    function(elem) {
                        elem.parentNode.removeChild(elem);
                    }
                )
            }
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
        insertCfgDialog();
        switch (getCurrentContext()) {
            case 'frontpage':
                getDiscordUsersOnline();
                addPortletUsersOnline();
                addPortletUsersAbsent();
                addServerStatusBar();
                break;
            case 'all_members':
                break;
            default:    // on any page
                hideGalleryNotifications();
                break;
        }
    }

    startScript();

})();