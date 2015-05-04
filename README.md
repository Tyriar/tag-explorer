# tag-explorer

A js library that creates a tag cloud that can filter articles additively by multiple tags.

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

Styles can be added rooted in `tagContainer`, for example:

```css
.tag-container { ... }
.tag-container li { ... }
.tag-container .letter-header { ... }
.tag-container button { ... }
```
