(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.tagExplorer = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
 * tag-explorer
 * http://github.com/Tyriar/tag-explorer
 *
 * @license Copyright 2015 Daniel Imms (http://www.growingwiththeweb.com)
 * Released under the MIT license
 * http://github.com/Tyriar/tag-explorer/blob/master/LICENSE
 */
"use strict";
/**
 * Creates a tag cloud at |tagContainer| that can filter |visibleArticles| additively by multiple
 * tags.
 *
 * @param {HTMLElement} tagContainer the container the place the tags.
 * @param {Object[]} visibleArticles An array of article definitions to filter using the tags, each
 * array entry must be of the form: {'element': HTMLElement,'tags': Array}
 * @param {string[]} tagNames An array of tag names. This should contain all tags that the articles
 * contain, or more specifically, all tags wished to be filtered on.
 */
var tagExplorer = function (tagContainer, visibleArticles, tagNames) {
    'use strict';
    /**
     * An array of article definitions that are currently hidden. This can be derived from querying
     * the DOM but it is not efficient to do so, each array entry must be of the form:
     * {'element': HTMLElement,'tags': Array}
     * @type {Object[]}
     */
    var hiddenArticles = [];
    /**
     * The current tag filter
     * @type {string[]}
     */
    var filter = [];
    /**
     * A map of tag names that map to {Object}s. The {Object}s are made up of an
     * 'element' property containing a {HTMLElement} that points to the tag's DOM
     * element, and an {Array} of {string}s made up of the tag's "neighbour tags".
     * @type {Object}
     */
    var tags = {};
    /**
     * Initialises the tag buttons and letter headers.
     */
    function initTags() {
        if (String.prototype.localeCompare) {
            tagNames.sort(function (a, b) {
                return a.localeCompare(b);
            });
        }
        else {
            tagNames.sort();
        }
        var lastLetter = '';
        var menu = document.createElement('menu');
        var header;
        for (var i = 0; i < tagNames.length; i++) {
            header = undefined;
            if (lastLetter.toUpperCase() !== tagNames[i][0].toUpperCase()) {
                // Create the letter heading
                lastLetter = tagNames[i][0].toUpperCase();
                if (lastLetter.match(/[0-9.]/g)) {
                    lastLetter = '#';
                }
                header = document.createElement('div');
                header.textContent = lastLetter;
                header.setAttribute('aria-hidden', 'true');
                header.classList.add('letter-header');
            }
            var button = document.createElement('button');
            button.textContent = tagNames[i];
            button.addEventListener('click', toggleTag.bind(null, button));
            tags[tagNames[i]] = {
                'element': button,
                'neighbours': []
            };
            var li = document.createElement('li');
            if (header) {
                li.appendChild(header);
            }
            li.appendChild(button);
            menu.appendChild(li);
        }
        tagContainer.classList.add('show-all');
        tagContainer.appendChild(menu);
    }
    /**
     * Initialises tag neighbours for all tags. A tag is a tag neighbour when
     * there is an article which contains both tags.
     */
    function initTagNeighbours() {
        // TODO: Optimisation potential, binary search/insert
        var i, j, k;
        for (i = 0; i < visibleArticles.length; i++) {
            for (j = 0; j < visibleArticles[i].tags.length; j++) {
                for (k = 0; k < visibleArticles[i].tags.length; k++) {
                    if (j !== k) {
                        if (tags[visibleArticles[i].tags[j]].neighbours.indexOf(visibleArticles[i].tags[k]) === -1) {
                            tags[visibleArticles[i].tags[j]].neighbours.push(visibleArticles[i].tags[k]);
                        }
                    }
                }
            }
        }
        for (i = 0; i < hiddenArticles.length; i++) {
            for (j = 0; j < hiddenArticles[i].tags.length; j++) {
                for (k = 0; k < hiddenArticles[i].tags.length; k++) {
                    if (j !== k) {
                        if (tags[hiddenArticles[i].tags[j]].neighbours.indexOf(hiddenArticles[i].tags[k]) === -1) {
                            tags[hiddenArticles[i].tags[j]].neighbours.push(hiddenArticles[i].tags[k]);
                        }
                    }
                }
            }
        }
    }
    /**
     * Initialises visible posts based on the query string.
     */
    function initVisiblePosts() {
        // Check query string for any tags
        var i;
        var tParam = getQueryParameterByName('t');
        if (tParam) {
            var paramTags = tParam.split(',');
            for (i = 0; i < paramTags.length; i++) {
                var tag = tags[paramTags[i]];
                if (tag) {
                    toggleTag(tag.element);
                }
            }
        }
        for (i = 0; i < visibleArticles.length; i++) {
            visibleArticles[i].element.classList.add('active');
        }
    }
    /**
     * Toggles a tag, either increasing or decreasing the filter on the articles.
     * @param {HTMLElement} tagButton The tag button.
     */
    function toggleTag(tagButton) {
        if (tagButton.classList.contains('selected')) {
            tagButton.classList.remove('selected');
            removeTag(tagButton.textContent);
            reduceTagFade(tagButton.textContent);
        }
        else {
            tagButton.classList.add('selected');
            addTag(tagButton.textContent);
            increaseTagFade(tagButton.textContent);
        }
    }
    /**
     * Remove a tag from the filter.
     * @param {String} tag The tag to remove.
     */
    function removeTag(tag) {
        for (var i = 0; i < filter.length; i++) {
            if (filter[i] === tag) {
                filter.splice(i, 1);
                break;
            }
        }
        reduceFilter(tag);
    }
    /**
     * Add a tag to the filter.
     * @param {String} tag The tag to add.
     */
    function addTag(tag) {
        filter.push(tag);
        increaseFilter(tag);
    }
    /**
     * Increases the tag filter, hiding posts that do not match the new filter.
     * @param {String} tag The tab to increase the filter with.
     */
    function increaseFilter(tag) {
        for (var i = 0; i < visibleArticles.length; i++) {
            if (visibleArticles[i].tags.indexOf(tag) === -1) {
                hidePost(i--);
            }
        }
    }
    /**
     * Reduces the filter, showing posts that match the new filter.
     * @param {String} tag The tab to reduce the filter with.
     */
    function reduceFilter(tag) {
        var i;
        // Simple case, show all
        if (!filter.length) {
            // TODO: Can be optimized by bulk copying
            for (i = 0; i < hiddenArticles.length; i++) {
                showPost(i--);
            }
            // Remove active from all articles
            var activeTags = tagContainer.querySelectorAll('.active');
            for (i = 0; i < activeTags.length; i++) {
                activeTags[i].classList.remove('active');
            }
        }
        // If post contains tag, reevaluate
        for (i = 0; i < hiddenArticles.length; i++) {
            // Only need to check if the post DIDN'T contain the removed tag
            if (hiddenArticles[i].tags.indexOf(tag) === -1) {
                // TODO: Potential for data structure optimisation?
                var visible = true;
                // Each tag in the filter must be on the post
                for (var k = 0; k < filter.length; k++) {
                    if (hiddenArticles[i].tags.indexOf(filter[k]) === -1) {
                        visible = false;
                        break;
                    }
                }
                if (visible) {
                    showPost(i--);
                }
            }
        }
    }
    /**
     * Show a post.
     * @param {Integer} i The index of the post in {@link hiddenArticles}.
     */
    function showPost(i) {
        hiddenArticles[i].element.classList.add('active');
        visibleArticles.push(hiddenArticles[i]);
        hiddenArticles.splice(i, 1);
    }
    /**
     * Hide a post.
     * @param {Integer} i The index of the post in {@link visibleArticles}.
     */
    function hidePost(i) {
        visibleArticles[i].element.classList.remove('active');
        hiddenArticles.push(visibleArticles[i]);
        visibleArticles.splice(i, 1);
    }
    /**
     * Increases the tag filter.
     *
     * @param {string} tag The tag to increase the filter with.
     */
    function increaseTagFade(tag) {
        var i;
        if (tagContainer.classList.contains('show-all')) {
            tagContainer.classList.remove('show-all');
        }
        if (filter.length === 1) {
            // if it was the first activated tag, highlight all neighbours
            for (i = 0; i < tags[tag].neighbours.length; i++) {
                tags[tags[tag].neighbours[i]].element.classList.add('active');
            }
        }
        else {
            // only proceed if the new tag is a neighbour of the previous tags (ie. it's inactive)
            var isNeighbour = true;
            for (i = 0; i < filter.length; i++) {
                if (filter[i] !== tag && tags[filter[i]].neighbours.indexOf(tag) === -1) {
                    isNeighbour = false;
                }
            }
            var activeTags;
            if (isNeighbour) {
                // deactivate any active tags that are not neighbours of the new tag
                activeTags = tagContainer.querySelectorAll('.active:not(.selected)');
                // Need to check articles here, not tags
                for (i = 0; i < activeTags.length; i++) {
                    if (tags[tag].neighbours.indexOf(activeTags[i].innerHTML) === -1) {
                        activeTags[i].classList.remove('active');
                    }
                }
                // Check all visible articles for the tag, if it's not present, remove .active
                for (i = 0; i < activeTags.length; i++) {
                    var found = false;
                    for (var j = 0; j < visibleArticles.length; j++) {
                        if (visibleArticles[j].tags.indexOf(activeTags[i].innerHTML) !== -1) {
                            // It was found, exit
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        activeTags[i].classList.remove('active');
                    }
                }
            }
            else {
                // hide all non-selected active tags
                // TODO: Could be merged with the above section, could make complex though
                activeTags = tagContainer.querySelectorAll('.active:not(.selected)');
                for (i = 0; i < activeTags.length; i++) {
                    activeTags[i].classList.remove('active');
                }
            }
        }
        tags[tag].element.classList.add('active');
    }
    /**
     * Reduces the tag filter.
     *
     * @param {string} tag The tag to reduce the filter with.
     */
    function reduceTagFade(tag) {
        var i;
        if (!filter.length) {
            tagContainer.classList.add('show-all');
            // TODO: Fix bug
            // for (i = 0; i < tags.length; i++) {
            //   tags[i].element.classList.remove('active');
            // }
            return;
        }
        // check :not(.active) tags
        if (areFilterTagsNeighbours()) {
            var inactiveTags = tagContainer.querySelectorAll('button:not(.active)');
            for (i = 0; i < inactiveTags.length; i++) {
                // if they do not contain the tag
                // re-evaluate them - check if the tag is in every filter tag neighbour set
                evaluateTagFadeState(inactiveTags[i]);
            }
        }
        // if the removed tag is not a neighbour of all filter tags, remove active
        var faded = false;
        for (i = 0; i < filter.length; i++) {
            for (var j = 0; j < tags[filter[i]].neighbours.length; j++) {
                if (tags[filter[i]].neighbours.indexOf(tag) === -1) {
                    faded = true;
                    break;
                }
            }
        }
        if (faded) {
            tags[tag].element.classList.remove('active');
        }
        // When unchecking, it's still active, evaluate individually
        evaluateTagFadeState(tags[tag].element);
    }
    /**
     * Check all visible articles, if the tag is present in at least one then add
     * the active class
     */
    function evaluateTagFadeState(element) {
        var found = false;
        for (var i = 0; i < visibleArticles.length; i++) {
            if (visibleArticles[i].tags.indexOf(element.innerHTML) !== -1) {
                found = true;
                break;
            }
        }
        if (found) {
            element.classList.add('active');
        }
    }
    /**
     * @return Whether all current filter tags are neighbours.
     */
    function areFilterTagsNeighbours() {
        for (var i = 0; i < filter.length; i++) {
            for (var j = i + 1; j < filter.length; j++) {
                if (tags[filter[i]].neighbours.indexOf(filter[j]) === -1 ||
                    tags[filter[j]].neighbours.indexOf(filter[i]) === -1) {
                    return false;
                }
            }
        }
        return true;
    }
    /**
     * Gets a query string parameter by name.
     *
     * @param {string} name The name of the query string parameter.
     * @return {string} The value of the query string parameter.
     */
    function getQueryParameterByName(name) {
        name = name.replace(/[\[]/, '\\\[').replace(/[\]]/, '\\\]');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'), results = regex.exec(location.search);
        return results == null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }
    initTags();
    initTagNeighbours();
    initVisiblePosts();
};
module.exports = tagExplorer;

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvdGFnRXhwbG9yZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiFcbiAqIHRhZy1leHBsb3JlclxuICogaHR0cDovL2dpdGh1Yi5jb20vVHlyaWFyL3RhZy1leHBsb3JlclxuICpcbiAqIEBsaWNlbnNlIENvcHlyaWdodCAyMDE1IERhbmllbCBJbW1zIChodHRwOi8vd3d3Lmdyb3dpbmd3aXRodGhld2ViLmNvbSlcbiAqIFJlbGVhc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZVxuICogaHR0cDovL2dpdGh1Yi5jb20vVHlyaWFyL3RhZy1leHBsb3Jlci9ibG9iL21hc3Rlci9MSUNFTlNFXG4gKi9cblwidXNlIHN0cmljdFwiO1xuLyoqXG4gKiBDcmVhdGVzIGEgdGFnIGNsb3VkIGF0IHx0YWdDb250YWluZXJ8IHRoYXQgY2FuIGZpbHRlciB8dmlzaWJsZUFydGljbGVzfCBhZGRpdGl2ZWx5IGJ5IG11bHRpcGxlXG4gKiB0YWdzLlxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHRhZ0NvbnRhaW5lciB0aGUgY29udGFpbmVyIHRoZSBwbGFjZSB0aGUgdGFncy5cbiAqIEBwYXJhbSB7T2JqZWN0W119IHZpc2libGVBcnRpY2xlcyBBbiBhcnJheSBvZiBhcnRpY2xlIGRlZmluaXRpb25zIHRvIGZpbHRlciB1c2luZyB0aGUgdGFncywgZWFjaFxuICogYXJyYXkgZW50cnkgbXVzdCBiZSBvZiB0aGUgZm9ybTogeydlbGVtZW50JzogSFRNTEVsZW1lbnQsJ3RhZ3MnOiBBcnJheX1cbiAqIEBwYXJhbSB7c3RyaW5nW119IHRhZ05hbWVzIEFuIGFycmF5IG9mIHRhZyBuYW1lcy4gVGhpcyBzaG91bGQgY29udGFpbiBhbGwgdGFncyB0aGF0IHRoZSBhcnRpY2xlc1xuICogY29udGFpbiwgb3IgbW9yZSBzcGVjaWZpY2FsbHksIGFsbCB0YWdzIHdpc2hlZCB0byBiZSBmaWx0ZXJlZCBvbi5cbiAqL1xudmFyIHRhZ0V4cGxvcmVyID0gZnVuY3Rpb24gKHRhZ0NvbnRhaW5lciwgdmlzaWJsZUFydGljbGVzLCB0YWdOYW1lcykge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICAvKipcbiAgICAgKiBBbiBhcnJheSBvZiBhcnRpY2xlIGRlZmluaXRpb25zIHRoYXQgYXJlIGN1cnJlbnRseSBoaWRkZW4uIFRoaXMgY2FuIGJlIGRlcml2ZWQgZnJvbSBxdWVyeWluZ1xuICAgICAqIHRoZSBET00gYnV0IGl0IGlzIG5vdCBlZmZpY2llbnQgdG8gZG8gc28sIGVhY2ggYXJyYXkgZW50cnkgbXVzdCBiZSBvZiB0aGUgZm9ybTpcbiAgICAgKiB7J2VsZW1lbnQnOiBIVE1MRWxlbWVudCwndGFncyc6IEFycmF5fVxuICAgICAqIEB0eXBlIHtPYmplY3RbXX1cbiAgICAgKi9cbiAgICB2YXIgaGlkZGVuQXJ0aWNsZXMgPSBbXTtcbiAgICAvKipcbiAgICAgKiBUaGUgY3VycmVudCB0YWcgZmlsdGVyXG4gICAgICogQHR5cGUge3N0cmluZ1tdfVxuICAgICAqL1xuICAgIHZhciBmaWx0ZXIgPSBbXTtcbiAgICAvKipcbiAgICAgKiBBIG1hcCBvZiB0YWcgbmFtZXMgdGhhdCBtYXAgdG8ge09iamVjdH1zLiBUaGUge09iamVjdH1zIGFyZSBtYWRlIHVwIG9mIGFuXG4gICAgICogJ2VsZW1lbnQnIHByb3BlcnR5IGNvbnRhaW5pbmcgYSB7SFRNTEVsZW1lbnR9IHRoYXQgcG9pbnRzIHRvIHRoZSB0YWcncyBET01cbiAgICAgKiBlbGVtZW50LCBhbmQgYW4ge0FycmF5fSBvZiB7c3RyaW5nfXMgbWFkZSB1cCBvZiB0aGUgdGFnJ3MgXCJuZWlnaGJvdXIgdGFnc1wiLlxuICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICovXG4gICAgdmFyIHRhZ3MgPSB7fTtcbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXNlcyB0aGUgdGFnIGJ1dHRvbnMgYW5kIGxldHRlciBoZWFkZXJzLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGluaXRUYWdzKCkge1xuICAgICAgICBpZiAoU3RyaW5nLnByb3RvdHlwZS5sb2NhbGVDb21wYXJlKSB7XG4gICAgICAgICAgICB0YWdOYW1lcy5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGEubG9jYWxlQ29tcGFyZShiKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGFnTmFtZXMuc29ydCgpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBsYXN0TGV0dGVyID0gJyc7XG4gICAgICAgIHZhciBtZW51ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbWVudScpO1xuICAgICAgICB2YXIgaGVhZGVyO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRhZ05hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBoZWFkZXIgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBpZiAobGFzdExldHRlci50b1VwcGVyQ2FzZSgpICE9PSB0YWdOYW1lc1tpXVswXS50b1VwcGVyQ2FzZSgpKSB7XG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIHRoZSBsZXR0ZXIgaGVhZGluZ1xuICAgICAgICAgICAgICAgIGxhc3RMZXR0ZXIgPSB0YWdOYW1lc1tpXVswXS50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIGlmIChsYXN0TGV0dGVyLm1hdGNoKC9bMC05Ll0vZykpIHtcbiAgICAgICAgICAgICAgICAgICAgbGFzdExldHRlciA9ICcjJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaGVhZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICAgICAgaGVhZGVyLnRleHRDb250ZW50ID0gbGFzdExldHRlcjtcbiAgICAgICAgICAgICAgICBoZWFkZXIuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgICAgICAgICAgICAgaGVhZGVyLmNsYXNzTGlzdC5hZGQoJ2xldHRlci1oZWFkZXInKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBidXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICAgICAgICAgIGJ1dHRvbi50ZXh0Q29udGVudCA9IHRhZ05hbWVzW2ldO1xuICAgICAgICAgICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdG9nZ2xlVGFnLmJpbmQobnVsbCwgYnV0dG9uKSk7XG4gICAgICAgICAgICB0YWdzW3RhZ05hbWVzW2ldXSA9IHtcbiAgICAgICAgICAgICAgICAnZWxlbWVudCc6IGJ1dHRvbixcbiAgICAgICAgICAgICAgICAnbmVpZ2hib3Vycyc6IFtdXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdmFyIGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICAgICAgICAgIGlmIChoZWFkZXIpIHtcbiAgICAgICAgICAgICAgICBsaS5hcHBlbmRDaGlsZChoZWFkZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGkuYXBwZW5kQ2hpbGQoYnV0dG9uKTtcbiAgICAgICAgICAgIG1lbnUuYXBwZW5kQ2hpbGQobGkpO1xuICAgICAgICB9XG4gICAgICAgIHRhZ0NvbnRhaW5lci5jbGFzc0xpc3QuYWRkKCdzaG93LWFsbCcpO1xuICAgICAgICB0YWdDb250YWluZXIuYXBwZW5kQ2hpbGQobWVudSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpc2VzIHRhZyBuZWlnaGJvdXJzIGZvciBhbGwgdGFncy4gQSB0YWcgaXMgYSB0YWcgbmVpZ2hib3VyIHdoZW5cbiAgICAgKiB0aGVyZSBpcyBhbiBhcnRpY2xlIHdoaWNoIGNvbnRhaW5zIGJvdGggdGFncy5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpbml0VGFnTmVpZ2hib3VycygpIHtcbiAgICAgICAgLy8gVE9ETzogT3B0aW1pc2F0aW9uIHBvdGVudGlhbCwgYmluYXJ5IHNlYXJjaC9pbnNlcnRcbiAgICAgICAgdmFyIGksIGosIGs7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB2aXNpYmxlQXJ0aWNsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCB2aXNpYmxlQXJ0aWNsZXNbaV0udGFncy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIGZvciAoayA9IDA7IGsgPCB2aXNpYmxlQXJ0aWNsZXNbaV0udGFncy5sZW5ndGg7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaiAhPT0gaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhZ3NbdmlzaWJsZUFydGljbGVzW2ldLnRhZ3Nbal1dLm5laWdoYm91cnMuaW5kZXhPZih2aXNpYmxlQXJ0aWNsZXNbaV0udGFnc1trXSkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnc1t2aXNpYmxlQXJ0aWNsZXNbaV0udGFnc1tqXV0ubmVpZ2hib3Vycy5wdXNoKHZpc2libGVBcnRpY2xlc1tpXS50YWdzW2tdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgaGlkZGVuQXJ0aWNsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBoaWRkZW5BcnRpY2xlc1tpXS50YWdzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgZm9yIChrID0gMDsgayA8IGhpZGRlbkFydGljbGVzW2ldLnRhZ3MubGVuZ3RoOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGogIT09IGspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YWdzW2hpZGRlbkFydGljbGVzW2ldLnRhZ3Nbal1dLm5laWdoYm91cnMuaW5kZXhPZihoaWRkZW5BcnRpY2xlc1tpXS50YWdzW2tdKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWdzW2hpZGRlbkFydGljbGVzW2ldLnRhZ3Nbal1dLm5laWdoYm91cnMucHVzaChoaWRkZW5BcnRpY2xlc1tpXS50YWdzW2tdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXNlcyB2aXNpYmxlIHBvc3RzIGJhc2VkIG9uIHRoZSBxdWVyeSBzdHJpbmcuXG4gICAgICovXG4gICAgZnVuY3Rpb24gaW5pdFZpc2libGVQb3N0cygpIHtcbiAgICAgICAgLy8gQ2hlY2sgcXVlcnkgc3RyaW5nIGZvciBhbnkgdGFnc1xuICAgICAgICB2YXIgaTtcbiAgICAgICAgdmFyIHRQYXJhbSA9IGdldFF1ZXJ5UGFyYW1ldGVyQnlOYW1lKCd0Jyk7XG4gICAgICAgIGlmICh0UGFyYW0pIHtcbiAgICAgICAgICAgIHZhciBwYXJhbVRhZ3MgPSB0UGFyYW0uc3BsaXQoJywnKTtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBwYXJhbVRhZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgdGFnID0gdGFnc1twYXJhbVRhZ3NbaV1dO1xuICAgICAgICAgICAgICAgIGlmICh0YWcpIHtcbiAgICAgICAgICAgICAgICAgICAgdG9nZ2xlVGFnKHRhZy5lbGVtZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHZpc2libGVBcnRpY2xlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmlzaWJsZUFydGljbGVzW2ldLmVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogVG9nZ2xlcyBhIHRhZywgZWl0aGVyIGluY3JlYXNpbmcgb3IgZGVjcmVhc2luZyB0aGUgZmlsdGVyIG9uIHRoZSBhcnRpY2xlcy5cbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSB0YWdCdXR0b24gVGhlIHRhZyBidXR0b24uXG4gICAgICovXG4gICAgZnVuY3Rpb24gdG9nZ2xlVGFnKHRhZ0J1dHRvbikge1xuICAgICAgICBpZiAodGFnQnV0dG9uLmNsYXNzTGlzdC5jb250YWlucygnc2VsZWN0ZWQnKSkge1xuICAgICAgICAgICAgdGFnQnV0dG9uLmNsYXNzTGlzdC5yZW1vdmUoJ3NlbGVjdGVkJyk7XG4gICAgICAgICAgICByZW1vdmVUYWcodGFnQnV0dG9uLnRleHRDb250ZW50KTtcbiAgICAgICAgICAgIHJlZHVjZVRhZ0ZhZGUodGFnQnV0dG9uLnRleHRDb250ZW50KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRhZ0J1dHRvbi5jbGFzc0xpc3QuYWRkKCdzZWxlY3RlZCcpO1xuICAgICAgICAgICAgYWRkVGFnKHRhZ0J1dHRvbi50ZXh0Q29udGVudCk7XG4gICAgICAgICAgICBpbmNyZWFzZVRhZ0ZhZGUodGFnQnV0dG9uLnRleHRDb250ZW50KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSB0YWcgZnJvbSB0aGUgZmlsdGVyLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB0YWcgVGhlIHRhZyB0byByZW1vdmUuXG4gICAgICovXG4gICAgZnVuY3Rpb24gcmVtb3ZlVGFnKHRhZykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZpbHRlci5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKGZpbHRlcltpXSA9PT0gdGFnKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZWR1Y2VGaWx0ZXIodGFnKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkIGEgdGFnIHRvIHRoZSBmaWx0ZXIuXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHRhZyBUaGUgdGFnIHRvIGFkZC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBhZGRUYWcodGFnKSB7XG4gICAgICAgIGZpbHRlci5wdXNoKHRhZyk7XG4gICAgICAgIGluY3JlYXNlRmlsdGVyKHRhZyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEluY3JlYXNlcyB0aGUgdGFnIGZpbHRlciwgaGlkaW5nIHBvc3RzIHRoYXQgZG8gbm90IG1hdGNoIHRoZSBuZXcgZmlsdGVyLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB0YWcgVGhlIHRhYiB0byBpbmNyZWFzZSB0aGUgZmlsdGVyIHdpdGguXG4gICAgICovXG4gICAgZnVuY3Rpb24gaW5jcmVhc2VGaWx0ZXIodGFnKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmlzaWJsZUFydGljbGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodmlzaWJsZUFydGljbGVzW2ldLnRhZ3MuaW5kZXhPZih0YWcpID09PSAtMSkge1xuICAgICAgICAgICAgICAgIGhpZGVQb3N0KGktLSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVkdWNlcyB0aGUgZmlsdGVyLCBzaG93aW5nIHBvc3RzIHRoYXQgbWF0Y2ggdGhlIG5ldyBmaWx0ZXIuXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHRhZyBUaGUgdGFiIHRvIHJlZHVjZSB0aGUgZmlsdGVyIHdpdGguXG4gICAgICovXG4gICAgZnVuY3Rpb24gcmVkdWNlRmlsdGVyKHRhZykge1xuICAgICAgICB2YXIgaTtcbiAgICAgICAgLy8gU2ltcGxlIGNhc2UsIHNob3cgYWxsXG4gICAgICAgIGlmICghZmlsdGVyLmxlbmd0aCkge1xuICAgICAgICAgICAgLy8gVE9ETzogQ2FuIGJlIG9wdGltaXplZCBieSBidWxrIGNvcHlpbmdcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBoaWRkZW5BcnRpY2xlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHNob3dQb3N0KGktLSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBSZW1vdmUgYWN0aXZlIGZyb20gYWxsIGFydGljbGVzXG4gICAgICAgICAgICB2YXIgYWN0aXZlVGFncyA9IHRhZ0NvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCcuYWN0aXZlJyk7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYWN0aXZlVGFncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGFjdGl2ZVRhZ3NbaV0uY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gSWYgcG9zdCBjb250YWlucyB0YWcsIHJlZXZhbHVhdGVcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGhpZGRlbkFydGljbGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAvLyBPbmx5IG5lZWQgdG8gY2hlY2sgaWYgdGhlIHBvc3QgRElETidUIGNvbnRhaW4gdGhlIHJlbW92ZWQgdGFnXG4gICAgICAgICAgICBpZiAoaGlkZGVuQXJ0aWNsZXNbaV0udGFncy5pbmRleE9mKHRhZykgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogUG90ZW50aWFsIGZvciBkYXRhIHN0cnVjdHVyZSBvcHRpbWlzYXRpb24/XG4gICAgICAgICAgICAgICAgdmFyIHZpc2libGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIC8vIEVhY2ggdGFnIGluIHRoZSBmaWx0ZXIgbXVzdCBiZSBvbiB0aGUgcG9zdFxuICAgICAgICAgICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgZmlsdGVyLmxlbmd0aDsgaysrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChoaWRkZW5BcnRpY2xlc1tpXS50YWdzLmluZGV4T2YoZmlsdGVyW2tdKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZpc2libGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh2aXNpYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNob3dQb3N0KGktLSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNob3cgYSBwb3N0LlxuICAgICAqIEBwYXJhbSB7SW50ZWdlcn0gaSBUaGUgaW5kZXggb2YgdGhlIHBvc3QgaW4ge0BsaW5rIGhpZGRlbkFydGljbGVzfS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBzaG93UG9zdChpKSB7XG4gICAgICAgIGhpZGRlbkFydGljbGVzW2ldLmVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gICAgICAgIHZpc2libGVBcnRpY2xlcy5wdXNoKGhpZGRlbkFydGljbGVzW2ldKTtcbiAgICAgICAgaGlkZGVuQXJ0aWNsZXMuc3BsaWNlKGksIDEpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBIaWRlIGEgcG9zdC5cbiAgICAgKiBAcGFyYW0ge0ludGVnZXJ9IGkgVGhlIGluZGV4IG9mIHRoZSBwb3N0IGluIHtAbGluayB2aXNpYmxlQXJ0aWNsZXN9LlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGhpZGVQb3N0KGkpIHtcbiAgICAgICAgdmlzaWJsZUFydGljbGVzW2ldLmVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgICAgIGhpZGRlbkFydGljbGVzLnB1c2godmlzaWJsZUFydGljbGVzW2ldKTtcbiAgICAgICAgdmlzaWJsZUFydGljbGVzLnNwbGljZShpLCAxKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogSW5jcmVhc2VzIHRoZSB0YWcgZmlsdGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgdGFnIHRvIGluY3JlYXNlIHRoZSBmaWx0ZXIgd2l0aC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpbmNyZWFzZVRhZ0ZhZGUodGFnKSB7XG4gICAgICAgIHZhciBpO1xuICAgICAgICBpZiAodGFnQ29udGFpbmVyLmNsYXNzTGlzdC5jb250YWlucygnc2hvdy1hbGwnKSkge1xuICAgICAgICAgICAgdGFnQ29udGFpbmVyLmNsYXNzTGlzdC5yZW1vdmUoJ3Nob3ctYWxsJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZpbHRlci5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIC8vIGlmIGl0IHdhcyB0aGUgZmlyc3QgYWN0aXZhdGVkIHRhZywgaGlnaGxpZ2h0IGFsbCBuZWlnaGJvdXJzXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGFnc1t0YWddLm5laWdoYm91cnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0YWdzW3RhZ3NbdGFnXS5uZWlnaGJvdXJzW2ldXS5lbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gb25seSBwcm9jZWVkIGlmIHRoZSBuZXcgdGFnIGlzIGEgbmVpZ2hib3VyIG9mIHRoZSBwcmV2aW91cyB0YWdzIChpZS4gaXQncyBpbmFjdGl2ZSlcbiAgICAgICAgICAgIHZhciBpc05laWdoYm91ciA9IHRydWU7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgZmlsdGVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGZpbHRlcltpXSAhPT0gdGFnICYmIHRhZ3NbZmlsdGVyW2ldXS5uZWlnaGJvdXJzLmluZGV4T2YodGFnKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgaXNOZWlnaGJvdXIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgYWN0aXZlVGFncztcbiAgICAgICAgICAgIGlmIChpc05laWdoYm91cikge1xuICAgICAgICAgICAgICAgIC8vIGRlYWN0aXZhdGUgYW55IGFjdGl2ZSB0YWdzIHRoYXQgYXJlIG5vdCBuZWlnaGJvdXJzIG9mIHRoZSBuZXcgdGFnXG4gICAgICAgICAgICAgICAgYWN0aXZlVGFncyA9IHRhZ0NvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCcuYWN0aXZlOm5vdCguc2VsZWN0ZWQpJyk7XG4gICAgICAgICAgICAgICAgLy8gTmVlZCB0byBjaGVjayBhcnRpY2xlcyBoZXJlLCBub3QgdGFnc1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBhY3RpdmVUYWdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0YWdzW3RhZ10ubmVpZ2hib3Vycy5pbmRleE9mKGFjdGl2ZVRhZ3NbaV0uaW5uZXJIVE1MKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZVRhZ3NbaV0uY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgYWxsIHZpc2libGUgYXJ0aWNsZXMgZm9yIHRoZSB0YWcsIGlmIGl0J3Mgbm90IHByZXNlbnQsIHJlbW92ZSAuYWN0aXZlXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGFjdGl2ZVRhZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZvdW5kID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdmlzaWJsZUFydGljbGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmlzaWJsZUFydGljbGVzW2pdLnRhZ3MuaW5kZXhPZihhY3RpdmVUYWdzW2ldLmlubmVySFRNTCkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSXQgd2FzIGZvdW5kLCBleGl0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZVRhZ3NbaV0uY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBoaWRlIGFsbCBub24tc2VsZWN0ZWQgYWN0aXZlIHRhZ3NcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBDb3VsZCBiZSBtZXJnZWQgd2l0aCB0aGUgYWJvdmUgc2VjdGlvbiwgY291bGQgbWFrZSBjb21wbGV4IHRob3VnaFxuICAgICAgICAgICAgICAgIGFjdGl2ZVRhZ3MgPSB0YWdDb250YWluZXIucXVlcnlTZWxlY3RvckFsbCgnLmFjdGl2ZTpub3QoLnNlbGVjdGVkKScpO1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBhY3RpdmVUYWdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGFjdGl2ZVRhZ3NbaV0uY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRhZ3NbdGFnXS5lbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZWR1Y2VzIHRoZSB0YWcgZmlsdGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgdGFnIHRvIHJlZHVjZSB0aGUgZmlsdGVyIHdpdGguXG4gICAgICovXG4gICAgZnVuY3Rpb24gcmVkdWNlVGFnRmFkZSh0YWcpIHtcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIGlmICghZmlsdGVyLmxlbmd0aCkge1xuICAgICAgICAgICAgdGFnQ29udGFpbmVyLmNsYXNzTGlzdC5hZGQoJ3Nob3ctYWxsJyk7XG4gICAgICAgICAgICAvLyBUT0RPOiBGaXggYnVnXG4gICAgICAgICAgICAvLyBmb3IgKGkgPSAwOyBpIDwgdGFncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgLy8gICB0YWdzW2ldLmVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gY2hlY2sgOm5vdCguYWN0aXZlKSB0YWdzXG4gICAgICAgIGlmIChhcmVGaWx0ZXJUYWdzTmVpZ2hib3VycygpKSB7XG4gICAgICAgICAgICB2YXIgaW5hY3RpdmVUYWdzID0gdGFnQ29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoJ2J1dHRvbjpub3QoLmFjdGl2ZSknKTtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBpbmFjdGl2ZVRhZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAvLyBpZiB0aGV5IGRvIG5vdCBjb250YWluIHRoZSB0YWdcbiAgICAgICAgICAgICAgICAvLyByZS1ldmFsdWF0ZSB0aGVtIC0gY2hlY2sgaWYgdGhlIHRhZyBpcyBpbiBldmVyeSBmaWx0ZXIgdGFnIG5laWdoYm91ciBzZXRcbiAgICAgICAgICAgICAgICBldmFsdWF0ZVRhZ0ZhZGVTdGF0ZShpbmFjdGl2ZVRhZ3NbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIGlmIHRoZSByZW1vdmVkIHRhZyBpcyBub3QgYSBuZWlnaGJvdXIgb2YgYWxsIGZpbHRlciB0YWdzLCByZW1vdmUgYWN0aXZlXG4gICAgICAgIHZhciBmYWRlZCA9IGZhbHNlO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgZmlsdGVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRhZ3NbZmlsdGVyW2ldXS5uZWlnaGJvdXJzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRhZ3NbZmlsdGVyW2ldXS5uZWlnaGJvdXJzLmluZGV4T2YodGFnKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgZmFkZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZhZGVkKSB7XG4gICAgICAgICAgICB0YWdzW3RhZ10uZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBXaGVuIHVuY2hlY2tpbmcsIGl0J3Mgc3RpbGwgYWN0aXZlLCBldmFsdWF0ZSBpbmRpdmlkdWFsbHlcbiAgICAgICAgZXZhbHVhdGVUYWdGYWRlU3RhdGUodGFnc1t0YWddLmVsZW1lbnQpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDaGVjayBhbGwgdmlzaWJsZSBhcnRpY2xlcywgaWYgdGhlIHRhZyBpcyBwcmVzZW50IGluIGF0IGxlYXN0IG9uZSB0aGVuIGFkZFxuICAgICAqIHRoZSBhY3RpdmUgY2xhc3NcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBldmFsdWF0ZVRhZ0ZhZGVTdGF0ZShlbGVtZW50KSB7XG4gICAgICAgIHZhciBmb3VuZCA9IGZhbHNlO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZpc2libGVBcnRpY2xlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHZpc2libGVBcnRpY2xlc1tpXS50YWdzLmluZGV4T2YoZWxlbWVudC5pbm5lckhUTUwpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoZm91bmQpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogQHJldHVybiBXaGV0aGVyIGFsbCBjdXJyZW50IGZpbHRlciB0YWdzIGFyZSBuZWlnaGJvdXJzLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGFyZUZpbHRlclRhZ3NOZWlnaGJvdXJzKCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZpbHRlci5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IGkgKyAxOyBqIDwgZmlsdGVyLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRhZ3NbZmlsdGVyW2ldXS5uZWlnaGJvdXJzLmluZGV4T2YoZmlsdGVyW2pdKSA9PT0gLTEgfHxcbiAgICAgICAgICAgICAgICAgICAgdGFnc1tmaWx0ZXJbal1dLm5laWdoYm91cnMuaW5kZXhPZihmaWx0ZXJbaV0pID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBHZXRzIGEgcXVlcnkgc3RyaW5nIHBhcmFtZXRlciBieSBuYW1lLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIHF1ZXJ5IHN0cmluZyBwYXJhbWV0ZXIuXG4gICAgICogQHJldHVybiB7c3RyaW5nfSBUaGUgdmFsdWUgb2YgdGhlIHF1ZXJ5IHN0cmluZyBwYXJhbWV0ZXIuXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2V0UXVlcnlQYXJhbWV0ZXJCeU5hbWUobmFtZSkge1xuICAgICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC9bXFxbXS8sICdcXFxcXFxbJykucmVwbGFjZSgvW1xcXV0vLCAnXFxcXFxcXScpO1xuICAgICAgICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKCdbXFxcXD8mXScgKyBuYW1lICsgJz0oW14mI10qKScpLCByZXN1bHRzID0gcmVnZXguZXhlYyhsb2NhdGlvbi5zZWFyY2gpO1xuICAgICAgICByZXR1cm4gcmVzdWx0cyA9PSBudWxsID8gJycgOiBkZWNvZGVVUklDb21wb25lbnQocmVzdWx0c1sxXS5yZXBsYWNlKC9cXCsvZywgJyAnKSk7XG4gICAgfVxuICAgIGluaXRUYWdzKCk7XG4gICAgaW5pdFRhZ05laWdoYm91cnMoKTtcbiAgICBpbml0VmlzaWJsZVBvc3RzKCk7XG59O1xubW9kdWxlLmV4cG9ydHMgPSB0YWdFeHBsb3JlcjtcbiJdfQ==
