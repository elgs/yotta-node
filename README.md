yotta
==========
Yotta is a local file based key value database, written in Node.js.

#Installation

`npm install yotta`

#Usage

##Synchronously
```javascript
var Yotta = require('yotta').Yotta;

// specify data file location
var yottadb = new Yotta('./testdb');

yottadb.open();

yottadb.put("key0", "value0");
yottadb.put("key1", "value1");
yottadb.put("key2", "value2");
var v = yottadb.get("key0");
console.log(v); //value0

//find keys
var keysFound = yottadb.findKeys(function(key, index, keys) {
	return key === 'key0' || key === 'key2';
});
console.log(keysFound); //[ 'key0', 'key2' ]

//find
var found = yottadb.find(function(key, index, keys) {
	return key === 'key0' || key === 'key2';
});
console.log(found); //{ key0: 'value0', key2: 'value2' }

// remove
yottadb.remove('key0');

yottadb.close();
```

##Asynchronously
```javascript
var Yotta = require('yotta').Yotta;

// specify data file location
var yottadb = new Yotta('./testdb');

yottadb.open();

yottadb.put("key0a", "value0a", function() {
	yottadb.get("key0a", function(err, v) {
		console.log(v); // value0a
	});
});

//find keys
var keysFound = yottadb.findKeys(function(key, index, keys) {
	return key === 'key0' || key === 'key2';
}, function(err, keysFound) {
	console.log(keysFound); //[ 'key0', 'key2' ]
});

//find
var found = yottadb.find(function(key, index, keys) {
	return key === 'key0' || key === 'key2';
}, function(err, found) {
	console.log(found); //{ key0: 'value0', key2: 'value2' }
});

yottadb.remove('key0a', function (err) {
    console.log('removed.');
});

setTimeout(function(){
	yottadb.close();
}, 1000);
```

#More APIs
##vacuum
Each remove operation causes fragments in the data file, `vacuum` will help to compact the data file.
```javascript
// synchronously
yottadb.vacuum();

// or asynchronously
yottadb.vacuum(function(){
	console.log('vacuum done');
});
```

#About
The motivation of creating the Yotta DB is that I was looking for something similar to Redis without installation as a
heavy dependency. High performance is a concern in the design of Yotta DB. Most operations happen in a memory cache
layer, and the cache is synchronized to the disk every second or when the cache is too large.

#Roadmap
There are several things on my mind to do for Yotta DB:

1. A command line shell interface to manipulate the databases;
2. Implementation in other languages like Golang, Java and C;

Patches and ideas welcome.