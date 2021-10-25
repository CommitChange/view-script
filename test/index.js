var assert = require('assert'),
	domify = require('domify')

var app = require('../')
	parse = require('../lib/parse'),
	evaluate = require('../lib/evaluate')

window.app = app
window.evaluate = evaluate
window.parse = parse

describe('parse', function() {

	it('denests parens', function() {
		assert.deepEqual(parse('((1))'), ['(1)'])
	})

	it('turns a num into a demarcated number', function() {
		assert.deepEqual(parse('1'), [{val: 1}])
})

	it('turns a str into a demarcated string', function() {
		assert.deepEqual(parse('"what\'s up there bro?"'), [{val: "what's up there bro?"}])
	})

	it('turns a keyword into a demarcated key', function() {
		assert.deepEqual(parse('xyz'), [{key: "xyz"}])
	})

	it('turns a bool into a demarcated key', function() {
		assert.deepEqual(parse('xyz'), [{key: "xyz"}])
	})

	it('turns a bool into a demarcated key', function() {
		assert.deepEqual(parse('xyz'), [{key: "xyz"}])
	})

	it('turns an expression into an array of atoms and sub-expressions', function() {
		var sexpr = 'a (b (c z)) (d "hello!") 433.43 "sup brah"',
			parsed = [{key: 'a'}, 'b (c z)', 'd "hello!"', {val: '433.43'}, {val: "sup brah"}]
		assert.deepEqual(parse(sexpr), parsed)
	})

	it('correctly parses two strings in a row', function() {
		var sexpr = "'hey' 'there'",
			parsed = [{val: "hey"}, {val: "there"}]
		assert.deepEqual(parse(sexpr), parsed)
	})
})

describe('lib/evaluate', function() {

	it('returns a val', function() {
		assert.equal(evaluate('1', {}), 1)
		assert.equal(evaluate('"hi friends"', {}), "hi friends")
	})

	it('evals a 0-ary func', function() {
		assert.equal(evaluate("say_hi", {say_hi: function(){return 'hiii'}}), 'hiii')
	})

	it('evals an n-ary func', function() {
		assert.equal(evaluate("add 1 2", {add: function(x,y){return x+y}}), 3)
	})

	it('evals func chaining thing', function() {
		assert.equal(evaluate("add (add 2 3) (add 1 1)", {add: function(x,y){return x+y}}), 7)
	})

	it('evals partial func chaining thing', function() {
		assert.equal(evaluate("add 1 (add 2 (add 1 1))", {add: function(x,y){return x+y}}), 5)
	})

	it('evals nested scoped funcs', function() {
		assert.equal(evaluate("mul (add 1 2) 3", {add: function(x,y){return x+y}, mul: function(x,y) {return x*y}}), 9)
	})

	it('evals lazy funcs', function() {
		assert.equal(evaluate("fn", {fn: {_lazy: function(){return 'hiii'},}}), 'hiii')
	})

	it('evals a lazy n-ary func', function() {
		assert.equal(evaluate("add 1 2", {add: {_lazy: function(x,y){return x.val+y.val}}}), 3)
	})

	it('does not execute a nested func when the first func is undefined', function() {
		assert.equal(evaluate("add 1 dont 3 2", {dont: {_lazy: function() {return 'nope'}}}), undefined)
	})
})

describe('.def_lazy', function() {

	it('delays evaluation on function applications', function() {
		app.def_lazy('immediate', function(x) { app.vs(x) })
		app.def_lazy('noop', function() {})
		var div = document.createElement("div")
		div.appendChild(document.createComment("= immediate (def 'hey' 'heeey')"))
		div.appendChild(document.createComment("= noop (def 'hey' 'wuwhut')"))
		app.render(div)
		assert.equal(app.hey, 'heeey')
	})
})

describe('.def', function() {

	it('sets a single val', function() {
		app.def('x', 1)
		assert.equal(app.x, 1)
	})

	it('sets a nested object', function() {
		app.def('x.y', 1)
		assert.equal(app.x.y, 1)
	})

	it('sets two vals in the same nested object without overriding each other', function() {
		app.def('x.y', 1)
		app.def('x.z', 420)
		assert.equal(app.x.y, 1)
	})

	it('sets a nested val using dot notation in a string', function() {
		app.def('x.y.z', 1)
		app.def('x.y.q', 420)
		assert.equal(app.x.y.z, 1)
	})

	it('sets a nested val using dot notation in a string', function() {
		app.def('x.y', 1)
		app.def('x.z', 420)
		assert.equal(app.x.y, 1)
	})

	it('can use the result of a 0-ary function in the args of another fn', function() {
		app.def('hi', function(){return 'hi'})
		app.vs("def 'x' hi")
		assert.equal(app.x, 'hi')
	})

	xit('allows for vs-style function definition', function() {
		assert.equal(app.def('myadd x y', 'add x y').vs('myadd 1 2'), 3)
	})
})


describe('.view', function() {

	it('returns a single num', function() {
		assert.equal(app.vs('1'), 1)
	})

	it('returns a single num wrapped in arbitrary parens', function() {
		assert.equal(app.vs('(((1)))'), 1)
	})

	it('returns a single str', function() {
		assert.equal(app.vs('("hey there!")'), "hey there!")
	})

	it('returns the value for a single key def into the view data', function() {
		app.def('x', 420)
		assert.equal(app.vs('x'), 420)
	})

	it('returns the return val of a singleton function', function() {
		app.def('hi', function() { return 'heyo!' })
		assert.equal(app.vs('hi'), 'heyo!')
	})

	it('returns the return val of a function taking atoms as params', function() {
		assert.equal(app.vs('add 1 2'), 3)
	})

	it('returns the return val of various nested functions', function() {
		assert.equal(app.vs('add   (add   1 1)       (add 2  2)'), 6)
	})

	it('more nested lol', function() {
		assert.equal(app.vs('add (add 1 1) (add (add 3 4) (add 2 2))'), 13)
	})

	it('evaluates keys that dont exist as undefined', function() {
		assert.equal(app.vs('(watskfasdasdfasd)'), undefined)
	})

	// TODO
	xit('partial application', function() {
		app.def('partial', 'hi', function(name) { return 'hi ' + app.vs(name) })
		assert.equal(vs('partial 420'), 'hi 420')
	})

	it('allows for the definition of nested dotted keys', function() {
		app.def('a.b.c', 22)
		assert.equal(app.a.b.c, 22)
	})

})

describe('.render', function() {

	it('interpolates a num', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment("= put 12.32"))
		app.render(div)
		assert.equal(div.textContent, '12.32')
	})

	it('interpolates a str', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment("= put 'hello! world!' "))
		app.render(div)
		assert.equal(div.textContent, 'hello! world!')
	})

	it('interpolates a fn', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment("= put (add 1 2) "))
		app.render(div)
		assert.equal(div.textContent, '3')
	})

	it('interpolates a nested fn', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment("= put (cat 'answer is ' (add 1 2)) "))
		app.render(div)
		assert.equal(div.textContent, 'answer is 3')
	})

	it('interpolates key values', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment("= put add x y "))
		app.def({x: 2, y: 3})
		app.render(div)
		assert.equal(div.textContent, '5')
	})

	it('runs a function that can mess with the parent node', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment("= put make_blue "))
		app.def('make_blue', function(node) { node.parentNode.style.color = 'blue' })
		app.render(div)
		assert.equal(div.style.color, 'blue')
	})

	it('retrieves nested keys from view data', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment("= put x.y.z "))
		app.def({x: {y: {z: 1}}})
		app.render(div)
		assert.equal(div.textContent, '1')
	})

	it('retrieves unnested but dotted keys from view data', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment("= put x.y.z "))
		app.def("x.y.z", 420)
		app.render(div)
		assert.equal(div.textContent, '420')
	})

	it('sets nested keys exclusively from each other without overriding', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment("= put x.y "))
		app.def('x.y', 1)
		app.def('x.z', 44)
		app.render(div)
		assert.equal(div.textContent, '1')
	})
})

describe('data binding/updating', function() {

	it('updates an interpolation when data is changed', function() {
		var div = document.createElement("div"), div2 = document.createElement("div")
		div.appendChild(div2)
		div2.appendChild(document.createComment("= put xx"))
		app.def('xx', 1)
		app.render(div)
		assert.equal(div.textContent, '1')
		app.def('xx', 2)
		assert.equal(div.textContent, '2')
	})

	it('updates the interpolation of a function return val when data in the function params was changed', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment("= put add (add (add x x) 1) 1"))
		app.def('x', 1)
		app.render(div)
		assert.equal(div.textContent, '4')
		app.def('x', 2)
		assert.equal(div.textContent, '6')
	})

	it('re-evaluates child property bindings when the parent object is re-set', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment("= put obj.x"))
		app.def('obj', {x: 420})
		app.render(div)
		assert.equal(div.textContent, 420)
	})
})

describe('repeat', function() {

	it('repeats an array of vals', function() {
		var el = domify("<div><div><!--= repeat xs --><!--= put this --></div></div>")
		app.def('xs', [1,2,3])
		app.render(el)
		assert.equal(el.textContent, '123')
	})

	it('makes the index of each elem available', function() {
		var el = domify("<div><div><!--= repeat xs --><!--= put this.i --></div></div>")
		app.def('xs', [{},{},{}])
		app.render(el)
		assert.equal(el.textContent, '012')
	})

	it('repeats an evaluated array', function() {
		var el = domify("<div><div><!--= repeat tail xs --><!--= put this --></div></div>")
		app.def('xs', [1,2,3]).render(el)
		assert.equal(el.textContent, '23')
	})

	it('repeats changes in multiple arrays', function() {
		var el = domify("<div>\
<div><!--= repeat xs --><!--= put this --></div>\
<div><!--= repeat ys --><!--= put this --></div>\
</div>")

		app._bindings = {}
		app.render(el)

		app.def('xs', [1,2,3])
		app.def('ys', [4,5,6])
		assert.equal(el.textContent, '123456')

		app.def('ys', [7,8,9])
		assert.equal(el.textContent, '123789')

		app.def('xs', [10,11,12])
		assert.equal(el.textContent, '101112789')
	})

	it('renders into the template element', function() {
		var el = domify("<div><div><!--= repeat xs --><!--= put this --><!--= put wut --></div></div>")
		app.render(el)
		app.def('xs', [1,2,3])
		app.def('wut', 'sup')
		assert.equal(el.textContent, '1sup2sup3sup')
	})

	it('can do nested loops', function() {
		var el = domify("<div><div><!--= repeat xs --><span><!--= repeat this.ys --><!--= put this.content --><span></div></div>")
		app.render(el)
		app.def('xs', [{content: 'hi', ys: [{content: 'sup'}]}])
		assert.equal(el.textContent, 'sup')
	})

	it('can set data into the parent and into sibling iterations', function() {
		var el = domify("<div><div><!--= repeat xs --><!--= put wutt --></div></div>")
		app.def('xs', [1,2,3]).def('wutt', 'hi')
		app.render(el)
		assert.equal(el.textContent, 'hihihi')
	})
})


describe('if', function() {

	it('evals then_expr with predicate true', function() {
		assert.equal(app.vs("if true 'yup' 'nope'"), 'yup')
	})

	it('evals else_expr with predicate false', function() {
		assert.equal(app.vs("if false 'nope' 'yup'"), 'yup')
	})
})


describe("any", function() {
	it('returns the first truthy elem', function() {
		assert.equal(app.vs("any false null undefined 0 420 false"), 420)
	})

	it('returns the last elem if no elems are truthy', function() {
		assert.equal(app.vs("any null undefined 0 false"), false)
	})
})

describe("set_value", function() {
	it('sets the value of an input', function() {
		var el = domify("<div><input type='text'><!--= set_value myval --></div>")
		app.render(el)
		app.def('myval', '420')
		assert.equal(el.firstChild.value, '420')
	})

	it('clears the value of an input if the given val is undefined/null', function() {
		var el = domify("<div><input type='text'><!--= set_value myval --></div>")
		app.render(el)
		app.def('myval', undefined)
		assert.equal(el.firstChild.value, '')
	})
})

describe('form_object', function() {
	
	it('converts a form into an object', function() {
		var el = domify("<div><form>\
			<!--= def 'formyay' form_object -->\
			<input name='hey[hey]' value='there'>\
			<input type='checkbox' name='chck'>\
			<textarea name='yo'>first</textarea>\
			<input value='whuuut'>\
			<select name='yo'><option selected value='second'></option></select>\
			<input value='third' name='yo'>\
			</form></div>")
		app.render(el)
		assert.deepEqual(app.formyay, {'hey[hey]': 'there', yo: ['first', 'second', 'third'], chck: false})
	})

	it('unflattens dotted names', function() {
		var el = domify("<div><form>\
			<!--= def 'form_dotted' form_object -->\
			<input name='hey.hi' value='there'>\
			</form></div>")
		app.render(el)
		assert.deepEqual(app.form_dotted, {hey: {hi: 'there'}})
	})
})


describe('.scope', function() {

	it('child view can render data from the scope in the dom', function() {
		var div = document.createElement('div')
		div.appendChild(document.createComment("= scope 'child'"))
		div.appendChild(document.createComment("= put this.child_key"))
		app.render(div).def('child.child_key', 'hallo welt')
		assert.equal(div.textContent, 'hallo welt')
	})

	it('child view can access data from the dom from the parent view', function() {
		var el = domify("\
<div><!--= scope 's1' --><!--= def 'this.hiyo' 'from s1 - ' --></div>\
<div><!--= scope 's2' --><!--= def 'this.hiyo' 'from s2 - ' --><!--= def 'hiyo' 'from app'</div>")

		app.render(el)
		assert.deepEqual(app.s1.hiyo + app.s2.hiyo + app.hiyo, 'from s1 - from s2 - from app')
	})

	it('will render into the given scope name', function() {
		var el = domify("<div><!--= scope 'scope_x' --><!--= put this.hiyo --></div><div><!--= put hiyo --></div>")
		app.render(el)
		app.def('hiyo', 'from app').def('scope_x.hiyo', 'from scope_x ... ')
		assert.deepEqual(el.textContent, 'from scope_x ... from app')
	})

	it("two scopes with the same keys will not render into each other's scopes", function() {
		var el = domify("\
<div><!--= scope 'scope_x' --><!--= put this.hiyo --></div>\
<div><!--= scope 'scope_y' --><!--= put this.hiyo --></div>")

		app.render(el).def('hiyo', 'from app')
		app.def('scope_x.hiyo', 'from scope_x ... ')
		app.def('scope_y.hiyo', 'from scope_y')
		assert.deepEqual(el.textContent, 'from scope_x ... from scope_y')
	})

	it("will render data properly when scoped in multiple elements", function() {
		var el = domify("\
<div><!--= scope 'scope_x' --><!--= put this.hiyo --></div>\
<div><!--= scope 'scope_x' --><!--= put this.hiyo --></div>")

		app.render(el).def('scope_x.hiyo', 'from scope_x ... ')
		assert.deepEqual(el.textContent, 'from scope_x ... from scope_x ... ')
	})

	it("will evaluate functions defined in the parent within the scope", function() {
		var el = domify("\
<div>\
<!--= scope 's1' --><span>\
<!--= scope 's2' -->\
<!--= put this.key --></span>\
</div>")

		app.render(el).def('s1.key', 's1').def('s2.key', 's2')
		assert.equal(el.textContent, 's2')
	})

	it("can set a custom alias", function() {
		var el = domify("\
<div>\
<!--= scope 's1' 'scope' --><span>\
<!--= put scope.key --></span>\
</div>")

		app.render(el).def('s1.key', 'retrieved key')
		assert.equal(el.textContent, 'retrieved key')
	})


})

