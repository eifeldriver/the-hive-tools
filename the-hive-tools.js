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
    var js_version              = '0.0.1';
    var js_debug                = 1;
    var watcher1, watcher2;

    // --- config vars ---

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


    // ===============  main  ==================

    function addPortletUsersOnline() {
        var users = document.querySelector("section.box[data-box-identifier='com.woltlab.wcf.UsersOnline']");
        if (users) {
            var sidebar = document.querySelector('.sidebar.boxesSidebarRight .boxContainer');
            if (sidebar) {
                var box = document.createElement('SECTION');
                box.className = 'box';
                box.innerHTML = users.innerHTML;
                sidebar.prepend(box);
            }
        }
    }

    // ---  init script ---
    function startScript() {
        _debug('the-hive-tools started');
        addPortletUsersOnline();
    }

    // ---  window loaded  ---
    if (false) {
        /**
         * exec some tasks after the page has loading finished
         */
        function pageLoadFinish(e) {
            window.removeEventListener('load', pageLoadFinish); // prevent multiple calls
            window.setTimeout(startScript, 500);
        }
        // window.addEventListener('load', pageLoadFinish, false, true); // use bubbling and be cancelable
    }

    // --- wait for window loaded event ---
    startScript();

})();