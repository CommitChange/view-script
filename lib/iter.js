// Very simple & tiny browser-compatible map/fold/each/filter without the extras

var iter = module.exports = {}

iter.each = function(arr, fn) {
	if(!arr) return
	for(var i = 0; i < arr.length; ++i)
		fn(arr[i], i)
}


iter.map = function(arr, fn) {
	if(!arr) return []
	var result = []
	for(var i = 0; i < arr.length; ++i)
		result.push(fn(arr[i], i))
	return result
}


iter.fold = function(arr, x, y) {
	if(!arr) return init

	if(!y) var fn = x, init = arr[0], i = 1
	else   var fn = y, init = x,      i = 0

	var result = init
	for(var len = arr.length; i < len; ++i)
		result = fn(result, arr[i], i)
	return result
}


iter.filter = function(arr, pred) {
	if(!arr) return []
	var result = []
	for(var i = 0; i < arr.length; ++i)
		if(pred(arr[i], i)) result.push(arr[i])
	return result
}


iter.slice = function(arr, i, j) {
	var result = []
	if(i === undefined) i = 0
	if(j === undefined) j = arr.length

	for(var len = arr.length; i < j && i < len; ++i)
		result.push(arr[i])
	return result
}

