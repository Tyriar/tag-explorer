/*!
 * tag-explorer
 * http://github.com/Tyriar/tag-explorer
 *
 * @license Copyright 2015 Daniel Imms (http://www.growingwiththeweb.com)
 * Released under the MIT license
 * http://github.com/Tyriar/tag-explorer/blob/master/LICENSE
 */

declare var window: Window;

interface IArticle {
  element: HTMLElement;
  tags: string[];
}

/**
 * Creates a tag cloud at |tagContainer| that can filter |visibleArticles| additively by multiple
 * tags.
 *
 * @param {HTMLElement} tagContainer the container the place the tags.
 * @param {IArticle[]} visibleArticles An array of article definitions to filter using the tags, each
 * array entry must be of the form: {'element': HTMLElement,'tags': Array}
 * @param {string[]} tagNames An array of tag names. This should contain all tags that the articles
 * contain, or more specifically, all tags wished to be filtered on.
 */
function tagExplorer(tagContainer: HTMLElement, visibleArticles: IArticle[], tagNames: string[], win?: Window): void {
  'use strict';

  if (!win) {
    win = window;
  }
  const document: Document = win.document;

  /**
   * An array of article definitions that are currently hidden. This can be derived from querying
   * the DOM but it is not efficient to do so, each array entry must be of the form:
   * {'element': HTMLElement,'tags': Array}
   */
  const hiddenArticles: IArticle[] = [];

  /**
   * The current tag filter
   * @type {string[]}
   */
  const filter: string[] = [];

  /**
   * A map of tag names that map to {Object}s. The {Object}s are made up of an
   * 'element' property containing a {HTMLElement} that points to the tag's DOM
   * element, and an {Array} of {string}s made up of the tag's "neighbour tags".
   * @type {Object}
   */
  let tags: {} = {};

  /**
   * Initialises the tag buttons and letter headers.
   */
  function initTags(): void {
    if (String.prototype.localeCompare) {
      tagNames.sort((a, b) => {
        return a.localeCompare(b);
      });
    } else {
      tagNames.sort();
    }
    let lastLetter = '';
    const menu = document.createElement('menu');
    let header;
    for (let i = 0; i < tagNames.length; i++) {
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
      const button = document.createElement('button');
      button.textContent = tagNames[i];
      button.addEventListener('click', toggleTag.bind(null, button));
      tags[tagNames[i]] = {
        'element': button,
        'neighbours': []
      };
      const li = document.createElement('li');
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
  function initTagNeighbours(): void {
    // TODO: Optimisation potential, binary search/insert
    for (let i = 0; i < visibleArticles.length; i++) {
      for (let j = 0; j < visibleArticles[i].tags.length; j++) {
        for (let k = 0; k < visibleArticles[i].tags.length; k++) {
          if (j !== k) {
            if (tags[visibleArticles[i].tags[j]].neighbours.indexOf(visibleArticles[i].tags[k]) === -1) {
              tags[visibleArticles[i].tags[j]].neighbours.push(visibleArticles[i].tags[k]);
            }
          }
        }
      }
    }
    for (let i = 0; i < hiddenArticles.length; i++) {
      for (let j = 0; j < hiddenArticles[i].tags.length; j++) {
        for (let k = 0; k < hiddenArticles[i].tags.length; k++) {
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
  function initVisiblePosts(): void {
    // Check query string for any tags
    const tParam = getQueryParameterByName('t');
    if (tParam) {
      const paramTags = tParam.split(',');
      for (let i = 0; i < paramTags.length; i++) {
        const tag = tags[paramTags[i]];
        if (tag) {
          toggleTag(tag.element);
        }
      }
    }

    for (let i = 0; i < visibleArticles.length; i++) {
      visibleArticles[i].element.classList.add('active');
    }
  }

  /**
   * Toggles a tag, either increasing or decreasing the filter on the articles.
   * @param tagButton The tag button.
   */
  function toggleTag(tagButton: HTMLElement): void {
    if (tagButton.classList.contains('selected')) {
      tagButton.classList.remove('selected');
      removeTag(tagButton.textContent);
      reduceTagFade(tagButton.textContent);
    } else {
      tagButton.classList.add('selected');
      addTag(tagButton.textContent);
      increaseTagFade(tagButton.textContent);
    }
  }

  /**
   * Remove a tag from the filter.
   * @param {string} tag The tag to remove.
   */
  function removeTag(tag: string): void {
    for (let i = 0; i < filter.length; i++) {
      if (filter[i] === tag) {
        filter.splice(i, 1);
        break;
      }
    }
    reduceFilter(tag);
  }

  /**
   * Add a tag to the filter.
   * @param {string} tag The tag to add.
   */
  function addTag(tag: string): void {
    filter.push(tag);
    increaseFilter(tag);
  }

  /**
   * Increases the tag filter, hiding posts that do not match the new filter.
   * @param {string} tag The tab to increase the filter with.
   */
  function increaseFilter(tag: string): void {
    for (let i = 0; i < visibleArticles.length; i++) {
      if (visibleArticles[i].tags.indexOf(tag) === -1) {
        hidePost(i--);
      }
    }
  }

  /**
   * Reduces the filter, showing posts that match the new filter.
   * @param {string} tag The tab to reduce the filter with.
   */
  function reduceFilter(tag: string): void {
    // Simple case, show all
    if (!filter.length) {
      // TODO: Can be optimized by bulk copying
      for (let i = 0; i < hiddenArticles.length; i++) {
        showPost(i--);
      }
      // Remove active from all articles
      const activeTags = tagContainer.querySelectorAll('.active');
      for (let i = 0; i < activeTags.length; i++) {
        activeTags[i].classList.remove('active');
      }
    }
    // If post contains tag, reevaluate
    for (let i = 0; i < hiddenArticles.length; i++) {
      // Only need to check if the post DIDN'T contain the removed tag
      if (hiddenArticles[i].tags.indexOf(tag) === -1) {
        // TODO: Potential for data structure optimisation?
        let visible = true;
        // Each tag in the filter must be on the post
        for (let k = 0; k < filter.length; k++) {
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
   * @param {number} i The index of the post in {@link hiddenArticles}.
   */
  function showPost(i: number): void {
    hiddenArticles[i].element.classList.add('active');
    visibleArticles.push(hiddenArticles[i]);
    hiddenArticles.splice(i, 1);
  }

  /**
   * Hide a post.
   * @param {number} i The index of the post in {@link visibleArticles}.
   */
  function hidePost(i: number): void {
    visibleArticles[i].element.classList.remove('active');
    hiddenArticles.push(visibleArticles[i]);
    visibleArticles.splice(i, 1);
  }

  /**
   * Increases the tag filter.
   *
   * @param {string} tag The tag to increase the filter with.
   */
  function increaseTagFade(tag: string): void {
    if (tagContainer.classList.contains('show-all')) {
      tagContainer.classList.remove('show-all');
    }
    if (filter.length === 1) {
      // if it was the first activated tag, highlight all neighbours
      for (let i = 0; i < tags[tag].neighbours.length; i++) {
        tags[tags[tag].neighbours[i]].element.classList.add('active');
      }
    } else {
      // only proceed if the new tag is a neighbour of the previous tags (ie. it's inactive)
      let isNeighbour = true;
      for (let i = 0; i < filter.length; i++) {
        if (filter[i] !== tag && tags[filter[i]].neighbours.indexOf(tag) === -1) {
          isNeighbour = false;
        }
      }
      let activeTags;
      if (isNeighbour) {
        // deactivate any active tags that are not neighbours of the new tag
        activeTags = tagContainer.querySelectorAll('.active:not(.selected)');
        // Need to check articles here, not tags
        for (let i = 0; i < activeTags.length; i++) {
          if (tags[tag].neighbours.indexOf(activeTags[i].innerHTML) === -1) {
            activeTags[i].classList.remove('active');
          }
        }

        // Check all visible articles for the tag, if it's not present, remove .active
        for (let i = 0; i < activeTags.length; i++) {
          let found = false;
          for (let j = 0; j < visibleArticles.length; j++) {
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
      } else {
        // hide all non-selected active tags
        // TODO: Could be merged with the above section, could make complex though
        activeTags = tagContainer.querySelectorAll('.active:not(.selected)');
        for (let i = 0; i < activeTags.length; i++) {
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
  function reduceTagFade(tag: string): void {
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
      const inactiveTags = <NodeListOf<HTMLElement>>tagContainer.querySelectorAll('button:not(.active)');
      for (let i = 0; i < inactiveTags.length; i++) {
        // if they do not contain the tag
        // re-evaluate them - check if the tag is in every filter tag neighbour set
        evaluateTagFadeState(inactiveTags[i]);
      }
    }
    // if the removed tag is not a neighbour of all filter tags, remove active
    let faded = false;
    for (let i = 0; i < filter.length; i++) {
      for (let j = 0; j < tags[filter[i]].neighbours.length; j++) {
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
  function evaluateTagFadeState(element: HTMLElement): void {
    let found = false;
    for (let i = 0; i < visibleArticles.length; i++) {
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
  function areFilterTagsNeighbours(): boolean {
    for (let i = 0; i < filter.length; i++) {
      for (let j = i + 1; j < filter.length; j++) {
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
  function getQueryParameterByName(name: string): string {
    name = name.replace(/[\[]/, '\\\[').replace(/[\]]/, '\\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)'), results = regex.exec(win.location.search);
    return results == null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
  }

  initTags();
  initTagNeighbours();
  initVisiblePosts();
}

export = tagExplorer;
