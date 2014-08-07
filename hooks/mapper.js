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
			}
		}
	}
	return map;
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
				hook = hookMap[parsed.controller + '/' + parsed.method];
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
