/**
 * @param {Object} visibilePosts An array of article definitions to filter using
 * the tags, each array entry must be of the form:
 * {'element': HTMLElement,'tags': Array}
 */
tagExplorer = function (tagNames, tagContainer, visiblePosts) {
  'use strict';
  // TODO: Remove allow for optional tagNames, extract from articles instead
  // TODO: Check tagNames after setup matches all tags in visiblePosts, post
  //       console.warn otherwise
  // TODO: Implement articles param
  // TODO: Document the elements/classes being created

  var hiddenPosts = [];

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
  var fadedTags = [];

  initTags();
  initTagNeighbours();
  initVisiblePosts();
  // TODO: Use a more OO approach to simplify code

  function initTags() {
    var lastLetter = '';
    var menu = document.createElement('menu');
    for (var i = 0; i < tagNames.length; i++) {
      var header = undefined;
      if (lastLetter.toUpperCase() !== tagNames[i][0].toUpperCase()) {
        // Create the letter heading
        lastLetter = tagNames[i][0].toUpperCase();
        // TODO: Support other languages
        if (!lastLetter.match(/[a-zA-Z]/g)) {
          lastLetter = '#';
        }
        header = document.createElement('div');
        header.innerHTML = lastLetter;
        header.setAttribute('aria-hidden', 'true');
        header.classList.add('letter-header');
      }
      var button = document.createElement('button');
      button.innerHTML = tagNames[i];
      button.addEventListener('click', toggleTag);
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

  function initTagNeighbours() {
    // TODO: Optimisation potential, binary search/insert
    // TODO: The perf of this may not be reasonable with all posts
    for (var i = 0; i < visiblePosts.length; i++) {
      for (var j = 0; j < visiblePosts[i].tags.length; j++) {
        for (var k = 0; k < visiblePosts[i].tags.length; k++) {
          if (j !== k) {
            if (tags[visiblePosts[i].tags[j]].neighbours.indexOf(visiblePosts[i].tags[k]) === -1) {
              tags[visiblePosts[i].tags[j]].neighbours.push(visiblePosts[i].tags[k]);
            }
          }
        }
      }
    }
    for (var i = 0; i < hiddenPosts.length; i++) {
      for (var j = 0; j < hiddenPosts[i].tags.length; j++) {
        for (var k = 0; k < hiddenPosts[i].tags.length; k++) {
          if (j !== k) {
            if (tags[hiddenPosts[i].tags[j]].neighbours.indexOf(hiddenPosts[i].tags[k]) === -1) {
              tags[hiddenPosts[i].tags[j]].neighbours.push(hiddenPosts[i].tags[k]);
            }
          }
        }
      }
    }
  }

  function initVisiblePosts() {
    // Check query string for any tags
    var tParam = getQueryParameterByName('t');
    if (tParam) {
      var paramTags = tParam.split(',');
      for (var i = 0; i < paramTags.length; i++) {
        toggleTag.call(tags[paramTags[i]].element);
      }
    }

    for (var i = 0; i < visiblePosts.length; i++) {
      visiblePosts[i].element.classList.add('active');
    }
  }

  function toggleTag() {
    if (this.classList.contains('selected')) {
      this.classList.remove('selected');
      removeTag(this.innerHTML);
      reduceTagFade(this.innerHTML);
    } else {
      this.classList.add('selected');
      addTag(this.innerHTML);
      increaseTagFade(this.innerHTML);
    }
  }

  function removeTag(tag) {
    for (var i = 0; i < filter.length; i++) {
      if (filter[i] === tag) {
        filter.splice(i, 1);
        break;
      }
    }
    reduceFilter(tag);
  }

  function addTag(tag) {
    filter.push(tag);
    increaseFilter(tag);
  }

  function increaseFilter(tag) {
    for (var i = 0; i < visiblePosts.length; i++) {
      if (visiblePosts[i].tags.indexOf(tag) === -1) {
        hidePost(i--);
      }
    }
  }

  function reduceFilter(tag) {
    // Simple case, show all
    if (!filter.length) {
      // TODO: Can be optimized by bulk copying
      for (var i = 0; i < hiddenPosts.length; i++) {
        showPost(i--);
      }
      // Remove active from all posts
      var activeTags = tagContainer.querySelectorAll('.active');
      for (var i = 0; i < activeTags.length; i++) {
        activeTags[i].classList.remove('active');
      }
      /*for (var i = 0; i < hiddenPosts.length; i++) {
        visiblePosts.push(hiddenPosts[i]);
      }
      hiddenPosts = [];*/
    }
    // If post contains tag, reevaluate
    for (var i = 0; i < hiddenPosts.length; i++) {
      // Only need to check if the post DIDN'T contain the removed tag
      if (hiddenPosts[i].tags.indexOf(tag) === -1) {
        // TODO: Potential for data structure optimisation?
        var visible = true;
        // Each tag in the filter must be on the post
        for (var k = 0; k < filter.length; k++) {
          if (hiddenPosts[i].tags.indexOf(filter[k]) === -1) {
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

  function showPost(i, keepActive) {
    hiddenPosts[i].element.classList.add('active');
    visiblePosts.push(hiddenPosts[i]);
    hiddenPosts.splice(i, 1);
  }

  function hidePost(i) {
    visiblePosts[i].element.classList.remove('active');
    hiddenPosts.push(visiblePosts[i]);
    visiblePosts.splice(i, 1);
  }

  function increaseTagFade(tag) {
    if (tagContainer.classList.contains('show-all')) {
      tagContainer.classList.remove('show-all');
    }
    if (filter.length === 1) {
      // if it was the first activated tag, highlight all neighbours
      for (var i = 0; i < tags[tag].neighbours.length; i++) {
        tags[tags[tag].neighbours[i]].element.classList.add('active');
      }
    } else {
      // only proceed if the new tag is a neighbour of the previous tags (ie. it's inactive)
      var isNeighbour = true;
      for (var i = 0; i < filter.length; i++) {
        if (filter[i] !== tag && tags[filter[i]].neighbours.indexOf(tag) === -1) {
          isNeighbour = false;
        }
      }
      if (isNeighbour) {
        // deactivate any active tags that are not neighbours of the new tag
        var activeTags = tagContainer.querySelectorAll('.active:not(.selected)');
        // Need to check posts here, not tags
        for (var i = 0; i < activeTags.length; i++) {
          if (tags[tag].neighbours.indexOf(activeTags[i].innerHTML) === -1) {
            activeTags[i].classList.remove('active');
          }
        }

        // Check all visible posts for the tag, if it's not present, remove .active
        for (var i = 0; i < activeTags.length; i++) {
          var found = false
          for (var j = 0; j < visiblePosts.length; j++) {
            if (visiblePosts[j].tags.indexOf(activeTags[i].innerHTML) !== -1) {
              // It was found, exit
              found = true;
              break;
            }
          }
          if (!found) {
            activeTags[i].classList.remove('active');
          }
        }
      } else {
        // hide all non-selected active tags
        // TODO: Could be merged with the above section, could make complex though
        var activeTags = tagContainer.querySelectorAll('.active:not(.selected)');
        for (var i = 0; i < activeTags.length; i++) {
          activeTags[i].classList.remove('active');
        }
      }
    }
    tags[tag].element.classList.add('active');
  }

  function reduceTagFade(tag) {
    if (!filter.length) {
      tagContainer.classList.add('show-all');
      for (var i = 0; i < tags.length; i++) {
        tags[i].element.classList.remove('active');
      }
      return;
    }
    // check :not(.active) tags
    if (areFilterTagsNeighbours()) {
      var inactiveTags = tagContainer.querySelectorAll('button:not(.active)');
      for (var i = 0; i < inactiveTags.length; i++) {
        // if they do not contain the tag
        // re-evaluate them - check if the tag is in every filter tag neighbour set
        evaluateTagFadeState(inactiveTags[i]);
      }
    }
    // if the removed tag is not a neighbour of all filter tags, remove active
    var faded = false;
    for (var i = 0; i < filter.length; i++) {
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

  function evaluateTagFadeState(element) {
    // Check all visible posts, if the tag is present in at least one then add
    // the active class
    var found = false;
    for (var i = 0; i < visiblePosts.length; i++) {
      if (visiblePosts[i].tags.indexOf(element.innerHTML) !== -1) {
        found = true;
        break;
      }
    }
    if (found) {
      element.classList.add('active');
    }
  }

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

  function getQueryParameterByName(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"), results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
  }
  // TODO: update query string in URL when a different tag is selected
};

