let onChange;

module.exports = {
	setOnChange: value => {
		onChange = value;
	},
	testRunner: (t, object, options, callback) => {
		const last = {};

		const reset = () => {
			last.count = 0;
			last.thisArg = undefined;
			last.path = undefined;
			last.value = undefined;
			last.previous = undefined;
		};

		reset();

		const proxy = onChange(object, function (path, value, previous, applyData) {
			last.count++;
			last.thisArg = this;
			last.path = path;
			last.value = value;
			last.previous = previous;
			last.applyData = applyData;
		}, options);

		// eslint-disable-next-line max-params
		const verify = (count, thisArg, path, value, previous, applyData, fullObject) => {
			t.is(count, last.count, 'count is incorrect');
			t.is(thisArg, last.thisArg, 'thisArg is incorrect');
			t.deepEqual(path, last.path, 'path is incorrect');
			t.deepEqual(value, last.value, 'value is incorrect');
			t.deepEqual(previous, last.previous, 'previous value is incorrect');

			if (applyData === undefined) {
				t.is(applyData, last.applyData, 'applyData is incorrect');
			} else {
				t.is(Object.entries(applyData).length, Object.entries(last.applyData).length, 'applyData entries length is incorrect');
				t.is(applyData.name, last.applyData.name, 'applyData.name is incorrect');
				t.deepEqual(applyData.args, last.applyData.args, 'applyData.args is incorrect');
				t.deepEqual(applyData.result, last.applyData.result, 'applyData.result is incorrect');
			}

			t.is(object, onChange.target(proxy));

			if (fullObject !== undefined) {
				t.deepEqual(fullObject, object);
				t.deepEqual(proxy, object);
			}
		};

		callback(proxy, verify, reset, last);

		onChange.unsubscribe(proxy);
	}
};
