yotta
==========
Yotta DB is a local file based key value database, written in Node.js.

# Installation

## Module
`npm install yotta`

## Shell and CLI
`npm install yotta -g`

# Usage

## Yotta Shell

### Create a new DB
```
$ yotta mydb
mydb>
```
or
```
$ yotta
> open mydb
mydb>
```

### Exit Yotta DB shell
```
mydb> exit
> $
```

### Show all Yotta DB shell commands by hitting tab
```
$ yotta
>
close      exit       find       findkeys   get        open       put
quit       remove     test       use        vacuum     version

>
```

### Put some keys
```
mydb> put a 1
mydb> put b 2
mydb> put c 3
mydb> put d 4
mydb> put e 5
```

### Get a value from a key
```
mydb> get d
4
```

### Remove a key
```
mydb> remove c
mydb> get c
undefined
```

### Find keys
```
mydb> findkeys "key==='a' || key==='d'"
[ 'a', 'd' ]
```

### Find all keys
```
mydb> findkeys true
[ 'a', 'b', 'd', 'e' ]
```

### Find key value pairs
```
mydb> find "key==='a' || key==='d'"
{ a: '1', d: '4' }
```

### Find all key value pairs
```
mydb> find true
{ a: '1', b: '2', d: '4', e: '5' }
```

### Vacuum DB
```
mydb> vacuum
```

### Show version
```
mydb> version
0.1.1
```

## Yotta CLI

### Put some keys
```
$ yotta mydb put a 1
$ yotta mydb put b 2
$ yotta mydb put c 3
$ yotta mydb put d 4
$ yotta mydb put e 5
```

### Get a value from a key
```
$ yotta mydb get d
4
```

### Remove a key
```
$ yotta mydb remove c
$ yotta mydb get c
$
```

### Find keys
```
$ yotta mydb findkeys "key==='a' || key==='d'"
[ 'a', 'd' ]
```

### Find all keys
```
$ yotta mydb findkeys true
[ 'a', 'b', 'd', 'e' ]
```

### Find key value pairs
```
$ yotta mydb find "key==='a' || key==='d'"
{ a: '1', d: '4' }
```

### Find all key value pairs
```
$ yotta mydb find true
{ a: '1', b: '2', d: '4', e: '5' }
```

### Vacuum DB
```
$ yotta mydb vacuum
$
```

### Show version
```
$ yotta mydb version
0.1.1
```

## Module

### Synchronously
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
// or yottadb.close(true) to vacuum
```

### Asynchronously
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

// remove
//yottadb.remove('key0a', function (err) {
//    console.log('removed.');
//});

setTimeout(function(){
	yottadb.close();
	// or yottadb.close(true) to vacuum
}, 1000);
```

# More APIs
## vacuum
Each remove operation causes fragments in the data file, `vacuum` will help to
compact the data file.
```javascript
// synchronously
yottadb.vacuum();

// or asynchronously
yottadb.vacuum(function(){
	console.log('vacuum done');
});
```

## stats
Get the hole size information from the data file.
```javascript
var statsInfo = yottadb.stats();
// { holdSize: 630, dataFileSize: 672, holdRatio: 0.9375 }
```
Now it looks to be a perfect chance do a vacuum.
```javascript
yottadb.vacuum(function(){
	console.log(yottadb.stats());
});
// { holdSize: 0, dataFileSize: 42, holdRatio: 0 }
```

# About
The motivation of creating the Yotta DB is that I was looking for something
similar to Redis without installation as a heavy dependency. High performance
is a concern in the design of Yotta DB. Most operations happen in a memory
cache layer, and the cache is synchronized to the disk every second or when
the cache is too large.

# Roadmap
There are several things on my mind to do for Yotta DB:

1. Implementation in other languages like Golang, Java and C;

Patches and ideas welcome.