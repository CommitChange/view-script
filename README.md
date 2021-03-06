
NOTE: This is a legacy piece of code and should never be used.

NOTE 2: I don't know how this was compiled. I assume browserify given that it's listed as a tag in the package.json file.

view-script
=========

* forget querying! create state-driven user interfaces
* write feature-rich view logic in only a handful of lines!
* your dom intelligently updates based on changes to your view's state
* confuse your coworkers and friends with your weird comment code!
* 4k gzipped -- no dependencies

## installing

(it's not actually on npm yet -- coming soon)

You can install it with npm, then use it with browserify:

```sh
npm install view-script
```

```js
var app = require('view-script')
```

## getting started

```html
<p>
	Hallo, <!--= put name -->.
</p>
```

See that funny comment? That's viewscript in action, where both `put` and
`name` are keys in our view's data. Every time we change the value of either of
those keys, that line of viewscript gets re-evaluted.

```js
app.def('name', 'Bob Ross')
```

`app.def(key, value)` is used to update data in your view. The 'put' function is
built-in functionality, and will print your data into the dom.

**output**
```html
<p>
	Hallo, Bob Ross
</p>
```

How many things does Bob Ross have to do? Let's tell him.

```html
<p>
	Hallo, <!--= put name -->.
	You have <!--= put (length items) --> things to do.
</p>
```

```js
app.def('items', [])
```

**output**
```html
<p>
	Hallo, Bob Ross.
	You have 0 things to do.
</p>
```

`length` is another built-in that just counts the elements of an array.

viewscript uses [s-expressions](https://en.wikipedia.org/wiki/S-expression) because they're fast to parse and declarative. Every function in viewscript is **prefixed**, so instead of `1 + 2 + 3` you say `add 1 2 3`. Instead of `console.log('hi there')`, you simply say `log 'hi there'`.

Let's add a couple todo items for Bob.

```js
app.push('items', {content: 'Brush hair', done: false})
app.push('items', {content: 'Mix paints', done: false})
```

**output**
```html
<p>
	Hallo, Bob Ross.
	You have 2 things to do.
</p>
```

As soon as we pushed to 'items', the view updated without any extra work.
That's because it knew that 'items' was changed, so re-evaluated all lines of
viewscript that depend on 'items.'

Let's list each item for Bob Ross

```html
<p>
	Hallo, <!--= put name -->.
	You have <!--= put (length items) --> things to do.

	<ul>
		<li>
			<!--= repeat items -->
			<!--= put content -->
		</li>
	</ul>
</p>
```

**output**
```html
<p>
	Hallo, <!--= put name -->.
	You have <!--= put (length items) --> things to do.

	<ul>
		<li> Brush hair </li>
		<li> Mix paints </li>
	</ul>
</p>
```

The `repeat` function will duplicate an element for each item in a given array. Inside the `repeat`-ed element, everything is scoped to that element, so we can simply call `put content` and it'll print the content of each to-do item.

As a general rule, every viewscript function that messes with an element will affect its **parent** element. In the case of the few nodes without children like `<img>` or `<input>`, simply place viewscript directly after them to affect them.

So our `repeat` function repeats an `<li>` for every element inside `items'.

# view function reference

### functions that modify the node

| name | type | action | example |
|:---- |:---- |:------ |:----- |
| repeat  | Array | repeat the parent node for each element in the array | `(repeat user_listing)` |
| show_if | Value (predicate to test) | test a Value; if true, set display to ''; if false, set display to 'none' | `(show_if public_profile)` |
| hide_if | Value(predicate to test) | test a Value; if false, set display to 'none'; if true set display to '' | `(hide_if anonymous_profile)` |
| attr | name val | set an attribute to a value on the parent node | `(attr 'href' profile_link)` |
| remove_attr | name | remove the attribute from the parent node | `(remove_attr 'href')` |
| toggle_attr | name | remove the attribute from the parent node | `(toggle_attr `data-selected` id)` |
| class | val | set the class on the parent node as the value (will append to the node's class list) | `(class 'active')` |
| remove_class | val | remove the class from the parent node's class list, if it is present | `(remove_class 'active')` |
| toggle_class | val | either remove the class from the parent node's class list if present, or add the class if it is absent | `(toggle_class 'active')` |

### conditionals

| name | type | action | example |
|:---- |:---- |:------ |:----- |
| if | Value Expr Expr | if the predicate is true, evaluate the first expression, else evaluate the second expression (optional)  | `(if active_account (class 'active') (class 'inactive'))` |
| unless | Value Expr Expr | the inverse of `if` | `(unless confirmed_account (class 'confirmed'))` |

### data manipulation

| name | type | action | example |
|:---- |:---- |:------ |:----- |
| def | String Value | set the key to the given value in the view's data | `(set 'x' 1)` |
| push | Value String | push a value into an array in the view, given by the array's key name | `(push 1 'numbers')` |
| concat | Value String | push a value into an array in the view, given by the array's key name | `(push 1 'numbers')` |
| pop | String | push a value into an array in the view, given by the array's name | `(pop 'user_list')` |
| remove | Value String | find and remove the value from the array inside the view, given by the array's name | `(remove user 'user_list')` |

That's it! In only a dozen lines we have a functioning to-do list.

## patterns & tips

* Think of your view -- that is, your HTML and your viewscript -- as only the description of the layout and behavior of your data.
* Any complicated logic -- like ajax, list reduction, or detailed data processing -- can still live in the JS, not the view.
* Logic that's *related to an element* (like changing a class or setting an attribute) should live in your DOM. Any logic that has no relation to a particular element can live in your JS.

#### Why S-Expressions?

Reasons for using S-Expressions:

* It's very fast and simple to parse
* It really serves declarative-style coding -- in fact, it's not really possible to write procedural viewscript
* It makes it clear that the view expressions are **not** javascript
* It is visually scannable as distinct from html, but still reads somewhat similarly.

#### Why comments?

Traditional mustache-style text interpolation is less efficient: we have to check every character of every textContent in the entire templated text. And unless you've jumped through some hoops to hide those mustaches, users will often see a flash of braces and weird text on pageload, before your data is fetched.

With comments (or another special node), we only check the first character of each comment node. We can also use traditonal dom traversal very easily to find viewscript lines. It is also very visually distinct from the html tags. Finally, we don't have to hide or mess with the original viewscript nodes -- we can leave them be and re-evaluate them to our heart's content. So it's simpler.

#### Testing

Run `./test.sh` from the package root.
