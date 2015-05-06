# tag-explorer

A js library that creates a tag cloud that can filter articles additively by multiple tags.

![tag-explorer example](images/explore.png)

## Multiple filters

tag-explorer allows multiple tags to be filtered on, 

## Stucture and styling

The following HTML is generated within `tagContainer`.

```html
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
```

### `.active` and `.selected`

When at least one button has been toggled, the `.selected` class is added to the button and `.active` is applied to all 'tag neighbours` which are tags that are also present in articles that contain all selected tags. With styling, this allows the user to narrow down the filter much easier.

### `.show-all`

The `.show-all` class is applied to `tagContainer` when no tags are selected, this allows overriding of `:not(.active)` styles if no `.active` style exists.

### Styles

Styles can be added rooted in `tagContainer`, for example:

```css
.tag-container { ... }
.tag-container li { ... }
.tag-container .letter-header { ... }
.tag-container button { ... }
/* Style for active buttons (unselected tag neighbours or when no tags are selected */
.tag-container.show-all button,
.tag-container .active { ... }
.tag-container :not(.active) { ... }
.tag-container .selected { ... }
```
