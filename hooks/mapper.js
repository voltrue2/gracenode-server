module.exports.map = mapHooks;

module.exports.find = findInList;

function mapHooks(hooks) {
	var map = {};
	// all controllers and methods
	var hookAll = hasHooks(hooks);
	if (Array.isArray(hookAll)) {
		// apply hook(s) to all in-coming requests
		return hookAll;
	}
	// controller level
	/*
	for (var controller in hooks) {
		var hook = hasHooks(hooks[controller]);
		if (Array.isArray(hook)) {
			// hook(s) for a controller and all of its methods
			map[controller] = hook;
			continue;
		}
		for (var method in hooks[controller]) {
			hook = hasHooks(hooks[controller][method]);
			if (Array.isArray(hook)) {
				// hook(s) for a method of a controller
				map[controller + '/' + method] = hook;
				continue;
			}
		}
	}
	*/
	for (var controller in hooks) {
		var hook = hasHooks(hooks[controller]);
		if (Array.isArray(hook)) {
			// hook(s) for a controller and all of its methods
			map[controller] = hook;
			continue;
		}
		traverseHooks(map, hooks[controller], [controller]);
	}
	return map;
}

function traverseHooks(map, hooks, pathList) {
	for (var key in hooks) {
		var hookList = hasHooks(hooks[key]);
		if (Array.isArray(hookList)) {
			// we don't push to pathList in order to avoid contaminating the pathList array for the other keys in this map
			var paths = pathList.concat([key]);
			map[paths.join('/')] = hookList;
			continue;
		}
		// we need to dig deeper in the tier
		// we don't push to pathList in order to avoid contaminating the pathList array for the other keys in this map
		traverseHooks(map, hooks[key], pathList.concat([key]));
	}
}

function hasHooks(hooks) {
	if (Array.isArray(hooks) && typeof hooks[0] === 'function') {
		// multiple hooks found
		return hooks;
	} else if (typeof hooks === 'function') {
		// one hook found
		return [hooks];
	}
	// no hook(s) found
	return null;
}

function findInList(hookMapList, parsed) {
	var hooks = [];
	for (var i = 0, len = hookMapList.length; i < len; i++) {
		var found = find(hookMapList[i], parsed);
		if (found) {
			if (!Array.isArray(found)) {
				found = [found];
			}
			hooks = hooks.concat(found);
		}
	}
	if (!hooks.length) {
		return null;
	}
	return hooks;
}

function find(hookMap, parsed) {
	if (hookMap) {
		// hook all requests
		var hook = hookMap;
		if (!Array.isArray(hook)) {
			// hook all requests for a controller
			hook = hookMap[parsed.controller];
			if (!Array.isArray(hook)) {
				// hook a method of a controller
				hook = hookMap[parsed.controller + '/' + parsed.method + parsed.subdir];
			}
		}
		// do we have a hook?
		if (hook) {
			return hook;
		}
	}
	// there is no hook for this request
	return null;
}
