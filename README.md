yotta
==========
Yotta is a local file based key value database, written in Node.js.

#Installation

`npm install yotta`

#Usage

```
var Yotta = require('yotta').Yotta;

// specify data file location
var yottadb = new Yotta('./testdb');

yottadb.open();

yottadb.put("some_key", "some_value");
var v = yottadb.get("some_key");
console.log(v);

yottadb.close();
```

#About
The motivation of creating the Yotta DB is that I was looking for something like Redis without installation as a heavy
dependency. High performance is a concern in the design of Yotta DB. Most operations happen in a memory cache layer,
and the cache is synchronized to the disk every second or when the cache is too large.

#Roadmap
There are several things on my mind to do for Yotta DB:
1, A command line shell interface to manipulate the databases;
2, A set of asynchronous operation interfaces;
3, Implementation in other language like Golang, Java and C;

Patches and ideas welcome.