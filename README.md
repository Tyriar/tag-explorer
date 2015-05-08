# tag-explorer

A js library that creates a tag cloud that can filter articles by multiple tags. Each tag that is selected will fade tags that are not contained in any of the currently visible articles to allow the user to narrow down the filter much easier. The principal implementation of the library is in my website, [Growing with the Web][1] ([source code][2]).

![tag-explorer example](images/example.png)

## Stucture and styling

The following HTML is generated within `tagContainer`.

```html
<menu>
  <li>
    <div class="letter-header">A</div>
    <button>A title</button>
  </li>
  <li>
    <button>Another title</button>
  </li>
  <li>
    <div class="letter-header">N</div>
    <button>Next title</button>
  </li>
</menu>
```

### `.active` and `.selected`

When at least one button has been toggled, the `.selected` class is added to the button and `.active` is applied to all 'tag neighbours` which are tags that are also present in articles that contain all selected tags. With styling.

### `.show-all`

The `.show-all` class is applied to `tagContainer` when no tags are selected, this allows overriding of `:not(.active)` styles if no `.active` style exists.

### Styles

Styles can be added rooted in `tagContainer`, for example:

```css
.tag-container { ... }
.tag-container menu { ... }
.tag-container li { ... }
.tag-container .letter-header { ... }
.tag-container button { ... }
/* Style for active buttons (unselected tag neighbours or when no tags are selected */
.tag-container.show-all button,
.tag-container .active { ... }
.tag-container :not(.active) { ... }
.tag-container .selected { ... }

/* Hide articles without .active */
article {
  display: none
}
/* Style article visibility, this does not necessarily need to be an article tag */
article.active { ... }
```



[1]: http://www.growingwiththeweb.com/
[2]: https://github.com/Tyriar/tyriar.github.io
