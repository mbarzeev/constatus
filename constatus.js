var fs = require('fs'),
	esprima = require('esprima'),
	estraverse = require('estraverse'),
	Finder = require('fs-finder'),
	clc = require('cli-color'),
	error = clc.red.bold,

	conf = JSON.parse(fs.readFileSync(process.argv[2], encoding="ascii")),
	location = conf.location,
	constantsValues = conf.constantsValues,
	excludesFiles = conf.excludesFiles;

	inspectLocation(location);

function inspectLocation(location) {
	console.log('Inspecting', location);
	Finder.from(location).findFiles('*.js', function(files) {
		var ast,
			fileFullPath,
			filename,
			faults = {};
		for (var file in files) {
			fileFullPath = files[file];
			filename = fileFullPath.replace(/^.*[\\\/]/, '');
			
			if (filename && excludesFiles.indexOf(filename) === -1) {
				try {
					ast = esprima.parse(fs.readFileSync(fileFullPath), {loc:true});
					estraverse.traverse(ast, {
						enter: function (node, parent) {	
							if (node.type === 'Literal') {
								for (var item in constantsValues) {
									if (node.value === constantsValues[item]) {
										faults[node.value] = faults[node.value] || {count:0, locations:[]};
										faults[node.value].count++;
										faults[node.value].locations.push({file:filename, loc:node.loc});
									}
								}
							}
						},
						leave: function(node, parent) {
						}
					});
				} catch(e) {
				}
			}
		};

		for (var prop in faults) {
			if (faults.hasOwnProperty(prop)) {
				console.log(error('Fount "' + prop + '"', faults[prop].count, 'times:'));
				var location = null;
				for (var i = 0; i < faults[prop].count; i++) {
					location = faults[prop].locations[i];
					console.log(clc.red('\t', location.file, 'Line', location.loc.start.line));
				}
			}
		}
	});
}

